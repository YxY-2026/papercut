"""
剪纸小程序后端 - FastAPI
整合智能剪纸生成模块和自由创作模块

API 模块:
- /api/papercut/*    - 智能剪纸生成（上传、生成、合成）
- /api/works/*       - 自由创作作品管理（创建、查询、删除）
- /uploads/*         - 静态文件访问
- /temp/*            - 临时文件访问
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from routers.papercut import router as papercut_router
from routers.works import router as works_router
from routers.auth import router as auth_router
from routers.gallery import router as gallery_router

# 创建 FastAPI 应用
app = FastAPI(
    title="剪纸小程序后端 API",
    description="整合智能剪纸生成、自由创作、用户登录和社区功能",
    version="1.2.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/temp", StaticFiles(directory=settings.TEMP_DIR), name="temp")

# 注册路由
app.include_router(auth_router)       # /api/login
app.include_router(papercut_router)   # /api/papercut/*
app.include_router(works_router)      # /api/works/*
app.include_router(gallery_router)    # /api/works, /api/author/*, /api/search, /api/like/*, /api/collect/*, /api/follow/*, etc.


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "剪纸小程序后端 API",
        "version": "1.1.0",
        "docs": "/docs",
        "modules": {
            "auth": "/api/register, /api/login/account, /api/login - 用户认证",
            "papercut": "/api/papercut - 智能剪纸生成",
            "works": "/api/works - 自由创作作品管理",
            "gallery": "/api/community/* - 社区功能"
        }
    }


@app.get("/api/health")
async def health():
    """健康检查"""
    return {"status": "ok", "service": "papercut-backend"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
