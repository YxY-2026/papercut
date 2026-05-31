"""
用户认证模块路由 - 注册、登录
"""
import hashlib
import time
import random
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.user_service import user_service

router = APIRouter(prefix="/api", tags=["用户认证"])

# 微信 code 登录用内存用户（开发调试）
fake_users = {}


def generate_openid():
    """模拟微信用户唯一标识"""
    return "wx" + "".join(random.choices("0123456789abcdef", k=28))


class LoginRequest(BaseModel):
    """微信登录请求"""
    code: str
    nickname: Optional[str] = "剪纸爱好者"
    avatarUrl: Optional[str] = ""


class AccountLoginRequest(BaseModel):
    """账号密码登录"""
    username: str
    password: str


class RegisterRequest(BaseModel):
    """注册请求"""
    username: str
    password: str
    nickname: Optional[str] = None


class ApiResponse(BaseModel):
    """API统一响应格式"""
    code: int
    msg: str
    data: Optional[dict] = None


@router.post("/register", response_model=ApiResponse)
async def register(request: RegisterRequest):
    """用户注册（账号 + 密码）"""
    result = user_service.register(
        request.username, request.password, request.nickname
    )
    if not result["ok"]:
        return ApiResponse(code=400, msg=result["msg"])
    return ApiResponse(
        code=200,
        msg=result["msg"],
        data={"userInfo": result["user"]},
    )


@router.post("/login/account", response_model=ApiResponse)
async def login_account(request: AccountLoginRequest):
    """账号密码登录"""
    result = user_service.login_by_account(request.username, request.password)
    if not result["ok"]:
        return ApiResponse(code=400, msg=result["msg"])
    return ApiResponse(
        code=200,
        msg=result["msg"],
        data={
            "token": result["token"],
            "userInfo": result["userInfo"],
        },
    )


@router.post("/login", response_model=ApiResponse)
async def login(request: LoginRequest):
    """
    用户登录接口（模拟微信 code）
    """
    if not request.code:
        return ApiResponse(code=400, msg="参数错误")

    openid = generate_openid()

    if openid not in fake_users:
        fake_users[openid] = {
            "nickname": request.nickname,
            "avatar_url": request.avatarUrl,
            "works_count": 0,
            "likes_count": 0,
            "fans_count": 0,
        }
    else:
        fake_users[openid]["nickname"] = request.nickname
        fake_users[openid]["avatar_url"] = request.avatarUrl

    token = hashlib.md5((openid + str(time.time())).encode()).hexdigest()

    return ApiResponse(
        code=200,
        msg="登录成功",
        data={
            "token": token,
            "userInfo": {
                "openid": openid,
                "nickname": fake_users[openid]["nickname"],
                "avatarUrl": fake_users[openid]["avatar_url"],
                "worksCount": fake_users[openid]["works_count"],
                "likesCount": fake_users[openid]["likes_count"],
                "fansCount": fake_users[openid]["fans_count"],
            },
        },
    )
