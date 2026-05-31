"""
剪纸小程序后端配置文件
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""

    # 即梦 AI 密钥配置（从环境变量读取）
    JIMENG_ACCESS_KEY: str = ""
    JIMENG_SECRET_KEY: str = ""
    JIMENG_REQ_KEY: str = ""
    JIMENG_API_KEY: str = ""  # Bearer Token

    # 即梦 AI 接口配置（视觉服务）
    JIMENG_HOST: str = "visual.volcengineapi.com"
    JIMENG_REGION: str = "cn-north-1"
    JIMENG_ENDPOINT: str = "https://visual.volcengineapi.com"
    JIMENG_SERVICE: str = "cv"
    JIMENG_PATH: str = "/"
    JIMENG_VERSION: str = "2022-08-31"
    JIMENG_ACTION: str = "CVProcess"

    # 阿里云 COS 配置
    ALI_CLOUD_ACCESS_KEY_ID: str = ""
    ALI_CLOUD_ACCESS_KEY_SECRET: str = ""
    ALI_CLOUD_BUCKET_NAME: str = ""
    ALI_CLOUD_ENDPOINT: str = ""
    ALI_CLOUD_REGION: str = ""

    # 文件上传配置
    MAX_UPLOAD_SIZE: int = 20 * 1024 * 1024  # 20MB
    UPLOAD_DIR: str = "uploads"
    TEMP_DIR: str = "temp"

    # 跨域配置
    CORS_ORIGINS: list = ["*"]

    # 对外访问根地址（小程序请求、静态资源 URL）
    PUBLIC_BASE_URL: str = "http://127.0.0.1:8001"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
