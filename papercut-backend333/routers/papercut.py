"""
剪纸模块路由
"""
import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from models.papercut import (
    UploadResponse,
    GenerateRequest,
    GenerateResponse,
    ComposeRequest,
    ComposeResponse
)
from services.papercut_service import papercut_service

router = APIRouter(prefix="/api/papercut", tags=["剪纸"])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """上传文件（图片）"""
    try:
        # 读取文件内容
        file_content = await file.read()

        # 检查文件类型（微信小程序可能上报 application/octet-stream）
        allowed_types = [
            "image/jpeg", "image/png", "image/jpg", "image/webp",
            "application/octet-stream", None,
        ]
        ext = (file.filename or "").lower().split(".")[-1] if file.filename else ""
        if file.content_type not in allowed_types and ext not in (
            "jpg", "jpeg", "png", "webp", "gif"
        ):
            raise HTTPException(status_code=400, detail="不支持的文件类型")

        # 保存文件
        file_url = await papercut_service.upload_file(
            file_content=file_content,
            filename=file.filename,
            file_type=file.content_type
        )

        return UploadResponse(
            code=200,
            msg="上传成功",
            data={"imageUrl": file_url}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


@router.post("/upload-media", response_model=UploadResponse)
async def upload_media(file: UploadFile = File(...)):
    """上传媒体文件（音频、视频）"""
    try:
        # 读取文件内容
        file_content = await file.read()

        ext = (file.filename or "").lower().split(".")[-1] if file.filename else ""
        allowed_types = [
            "audio/mpeg", "audio/wav", "audio/mp3", "audio/x-m4a", "audio/mp4",
            "application/octet-stream", None,
        ]
        if file.content_type not in allowed_types and ext not in ("mp3", "wav", "m4a", "aac"):
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型: {file.content_type}"
            )

        file_url = await papercut_service.upload_media_file(
            file_content=file_content,
            filename=file.filename or "audio.mp3",
            file_type=file.content_type or "audio/mpeg"
        )

        return UploadResponse(
            code=200,
            msg="上传成功",
            data={"fileUrl": file_url, "imageUrl": file_url}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


@router.post("/generate", response_model=GenerateResponse)
async def generate_papercut(request: GenerateRequest):
    """生成剪纸图片"""
    try:
        # 解析 size 参数 (格式: "1080x1080")
        if "x" in request.size:
            width_str, height_str = request.size.split("x")
            width = int(width_str)
            height = int(height_str)
        else:
            width = 1080
            height = 1080

        result = await papercut_service.generate_papercut(
            original_image_url=request.image_url,
            width=width,
            height=height
        )

        return GenerateResponse(
            code=result.get("code", 200),
            msg=result.get("msg", "生成成功"),
            data=result.get("data")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")


@router.post("/compose", response_model=ComposeResponse)
async def compose_images(request: ComposeRequest):
    """合成剪纸图片和背景"""
    try:
        if not request.papercut_image_url:
            raise HTTPException(status_code=400, detail="缺少剪纸图片")

        result = await papercut_service.compose_images(
            papercut_image_url=request.papercut_image_url,
            background_image_url=request.background_image_url,
            background_music_url=request.background_music_url
        )

        return ComposeResponse(
            code=result.get("code", 200),
            msg=result.get("msg", "合成成功"),
            data=result.get("data", {})
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"合成失败: {str(e)}")


@router.get("/uploads/{filename}")
async def get_upload_file(filename: str):
    """获取上传的文件"""
    file_path = os.path.join(papercut_service.upload_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")

    return FileResponse(file_path)
