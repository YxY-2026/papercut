"""
即梦 AI 签名工具
支持两种认证方式：
1. Bearer Token（推荐，简单）
2. AWS V4 签名（官方模板）
"""
import datetime
import hashlib
import hmac
from urllib.parse import quote

from config import settings


def get_bearer_token_headers(api_key: str) -> dict:
    """
    生成 Bearer Token 认证头（推荐方式）

    Args:
        api_key: 即梦 AI API Key

    Returns:
        请求头字典
    """
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }


def norm_query(params: dict) -> str:
    """规范化查询参数"""
    query = ""
    for key in sorted(params.keys()):
        if isinstance(params[key], list):
            for k in params[key]:
                query += quote(key, safe="-_.~") + "=" + quote(k, safe="-_.~") + "&"
        else:
            query += quote(key, safe="-_.~") + "=" + quote(params[key], safe="-_.~") + "&"
    return query[:-1].replace("+", "%20") if query else ""


def hmac_sha256(key: bytes, content: str) -> bytes:
    """HMAC-SHA256 签名"""
    return hmac.new(key, content.encode("utf-8"), hashlib.sha256).digest()


def hash_sha256(content: str) -> str:
    """SHA256 哈希"""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def get_signature(method: str, path: str, query: dict, body: str, ak: str, sk: str) -> dict:
    """
    生成即梦 AI 请求签名

    Args:
        method: HTTP 方法 (GET/POST)
        path: 请求路径
        query: 查询参数字典
        body: 请求体字符串
        ak: Access Key
        sk: Secret Key

    Returns:
        请求头字典
    """
    content_type = "application/json"

    # 生成时间戳
    x_date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    short_date = x_date[:8]

    # 计算请求体哈希
    body_hash = hash_sha256(body)

    # 签名头
    signed_headers = "content-type;host;x-content-sha256;x-date"

    # 构造规范请求
    canonical_request = "\n".join([
        method.upper(),
        path,
        norm_query(query),
        f"content-type:{content_type}",
        f"host:{settings.JIMENG_HOST}",
        f"x-content-sha256:{body_hash}",
        f"x-date:{x_date}",
        "",
        signed_headers,
        body_hash
    ])

    # 构造凭证范围
    credential_scope = f"{short_date}/{settings.JIMENG_REGION}/{settings.JIMENG_SERVICE}/request"

    # 构造待签名字符串
    string_to_sign = "\n".join([
        "HMAC-SHA256",
        x_date,
        credential_scope,
        hash_sha256(canonical_request)
    ])

    # 计算签名密钥
    k_date = hmac_sha256(sk.encode(), short_date)
    k_region = hmac_sha256(k_date, settings.JIMENG_REGION)
    k_service = hmac_sha256(k_region, settings.JIMENG_SERVICE)
    k_signing = hmac_sha256(k_service, "request")

    # 计算签名
    signature = hmac_sha256(k_signing, string_to_sign).hex()

    # 构造请求头
    return {
        "Content-Type": content_type,
        "Host": settings.JIMENG_HOST,
        "X-Content-Sha256": body_hash,
        "X-Date": x_date,
        "Authorization": f"HMAC-SHA256 Credential={ak}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"
    }
