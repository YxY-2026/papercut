"""
剪纸模块数据模型
支持驼峰命名（前端兼容）
"""
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class UploadResponse(BaseModel):
    """上传响应模型"""
    code: int
    msg: str
    data: dict


class GenerateRequest(BaseModel):
    """生成请求模型 - 支持驼峰命名"""
    model_config = ConfigDict(populate_by_name=True)

    image_url: str = Field(alias="imageUrl")  # 驼峰兼容
    size: str = "1920x1080"  # "1920x1080", "1080x1920", "1080x1080"
    prompt: Optional[str] = None  # 可选参数，前端发送但后端忽略


class GenerateResponse(BaseModel):
    """生成响应模型"""
    code: int
    msg: str
    data: Optional[dict] = None


class ComposeRequest(BaseModel):
    """合成请求模型 - 支持驼峰命名"""
    model_config = ConfigDict(populate_by_name=True)

    papercut_image_url: str = Field(alias="papercutImageUrl")  # 驼峰兼容
    background_image_url: Optional[str] = Field(default=None, alias="backgroundImageUrl")  # 驼峰兼容
    background_music_url: Optional[str] = Field(default=None, alias="backgroundMusicUrl")  # 驼峰兼容


class ComposeResponse(BaseModel):
    """合成响应模型"""
    code: int
    msg: str
    data: dict
