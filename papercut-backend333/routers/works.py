"""
自由创作模块路由 - 作品管理
"""
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import settings

router = APIRouter(prefix="/api/works", tags=["作品管理"])

# 上传目录
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(exist_ok=True)

# 允许的图片格式
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}


# ==================== 数据模型 ====================
class WorkData(BaseModel):
    """作品数据模型"""
    id: str
    name: str
    url: str
    filename: str
    fold_type: int = 6  # 角数：4/6/8，默认6角
    created_at: str
    updated_at: Optional[str] = None


class WorkUpdateRequest(BaseModel):
    """更新作品请求"""
    name: Optional[str] = None
    fold_type: Optional[int] = None


class ApiResponse(BaseModel):
    """API 统一响应格式"""
    code: int = 0
    message: str = "success"
    data: Optional[dict | list] = None


# 内存存储作品列表（生产环境应使用数据库）
works_db: List[WorkData] = []


# ==================== 路由 ====================

@router.post("", response_model=ApiResponse)
async def create_work(
    image: UploadFile = File(...),
    name: str = Form("未命名作品"),
    fold_type: int = Form(6)
):
    """
    创建/保存剪纸作品
    
    - **image**: 图片文件（支持 png/jpg/jpeg/gif/webp）
    - **name**: 作品名称，默认"未命名作品"
    - **fold_type**: 角数（4/6/8），默认6角
    """
    # 验证文件类型
    if not image.filename:
        raise HTTPException(status_code=400, detail="未提供文件名")
    
    file_ext = Path(image.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"不支持的文件格式，支持: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 验证角数
    if fold_type not in [4, 6, 8]:
        fold_type = 6
    
    # 生成唯一文件名
    file_id = str(uuid.uuid4())[:8]
    new_filename = f"{file_id}{file_ext}"
    file_path = UPLOAD_DIR / new_filename
    
    # 保存文件
    try:
        content = await image.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")
    
    # 创建作品记录
    now = datetime.now().isoformat()
    work = WorkData(
        id=file_id,
        name=name,
        url=f"/uploads/{new_filename}",
        filename=new_filename,
        fold_type=fold_type,
        created_at=now,
        updated_at=now
    )
    works_db.append(work)
    
    return ApiResponse(
        code=0,
        message="作品保存成功",
        data=work.model_dump()
    )


@router.get("", response_model=ApiResponse)
async def get_works_list():
    """获取所有作品列表（按时间倒序）"""
    sorted_works = sorted(works_db, key=lambda x: x.created_at, reverse=True)
    return ApiResponse(
        code=0,
        message="success",
        data=[work.model_dump() for work in sorted_works]
    )


@router.get("/{work_id}", response_model=ApiResponse)
async def get_work(work_id: str):
    """获取单个作品详情"""
    work = next((w for w in works_db if w.id == work_id), None)
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    
    return ApiResponse(
        code=0,
        message="success",
        data=work.model_dump()
    )


@router.put("/{work_id}", response_model=ApiResponse)
async def update_work(work_id: str, request: WorkUpdateRequest):
    """更新作品信息"""
    work = next((w for w in works_db if w.id == work_id), None)
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    
    # 更新字段
    if request.name is not None:
        work.name = request.name
    if request.fold_type is not None and request.fold_type in [4, 6, 8]:
        work.fold_type = request.fold_type
    
    work.updated_at = datetime.now().isoformat()
    
    return ApiResponse(
        code=0,
        message="更新成功",
        data=work.model_dump()
    )


@router.delete("/{work_id}", response_model=ApiResponse)
async def delete_work(work_id: str):
    """删除指定作品"""
    global works_db
    
    # 查找作品
    work = next((w for w in works_db if w.id == work_id), None)
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    
    # 删除文件
    file_path = UPLOAD_DIR / work.filename
    if file_path.exists():
        os.remove(file_path)
    
    # 从列表中移除
    works_db = [w for w in works_db if w.id != work_id]
    
    return ApiResponse(code=0, message="删除成功")


@router.get("/{work_id}/image")
async def get_work_image(work_id: str):
    """获取作品图片"""
    work = next((w for w in works_db if w.id == work_id), None)
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    
    file_path = UPLOAD_DIR / work.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="图片文件不存在")
    
    return FileResponse(file_path)
