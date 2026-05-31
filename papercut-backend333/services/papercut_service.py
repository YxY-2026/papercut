import os
import base64
import json
import requests
import datetime
import hashlib
import hmac
import uuid
from typing import Optional, Dict, Any, List
from PIL import Image
from io import BytesIO

from config import settings
from utils.jimeng_signature import get_signature
from utils.papercut_filter import bytes_to_red_papercut

# 阿里云 OSS SDK
try:
    import oss2
    OSS_AVAILABLE = True
except ImportError:
    OSS_AVAILABLE = False
    print("Warning: oss2 not installed, local storage will be used")


class PaperCutService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.temp_dir = settings.TEMP_DIR
        
        # 初始化阿里云 OSS
        self.oss_bucket = None
        if OSS_AVAILABLE and settings.ALI_CLOUD_ACCESS_KEY_ID and settings.ALI_CLOUD_BUCKET_NAME:
            try:
                auth = oss2.Auth(
                    settings.ALI_CLOUD_ACCESS_KEY_ID,
                    settings.ALI_CLOUD_ACCESS_KEY_SECRET
                )
                self.oss_bucket = oss2.Bucket(
                    auth,
                    settings.ALI_CLOUD_ENDPOINT,
                    settings.ALI_CLOUD_BUCKET_NAME
                )
                print(f"阿里云 OSS 初始化成功: {settings.ALI_CLOUD_BUCKET_NAME}")
            except Exception as e:
                print(f"阿里云 OSS 初始化失败: {e}")
                self.oss_bucket = None
        
        # 确保目录存在
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

    def _fetch_image_bytes(self, image_url: str) -> bytes:
        """加载图片：优先读本地 uploads，避免自请求挂起"""
        if not image_url:
            raise Exception("图片地址为空")
        url = image_url.strip()
        if url.startswith("wxfile://") or url.startswith("http://tmp") or url.startswith("https://tmp"):
            raise Exception("请先上传图片到服务器后再合成")

        if "/uploads/" in url:
            filename = url.split("/uploads/")[-1].split("?")[0]
            local_path = os.path.join(self.upload_dir, filename)
            if os.path.isfile(local_path):
                with open(local_path, "rb") as f:
                    return f.read()

        resp = requests.get(url, timeout=20)
        if resp.status_code != 200:
            raise Exception(f"下载图片失败: HTTP {resp.status_code}")
        return resp.content

    def _public_url(self, filename: str) -> str:
        return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/uploads/{filename}"

    def _is_public_url(self, url: str) -> bool:
        u = (url or "").lower()
        return u.startswith("https://") and "127.0.0.1" not in u and "localhost" not in u

    def _save_papercut_bytes(self, image_bytes: bytes, prefix: str = "papercut") -> str:
        unique_filename = f"{prefix}_{uuid.uuid4()}.jpg"
        if self.oss_bucket:
            return self._upload_to_oss(image_bytes, unique_filename, "image/jpeg")
        file_path = os.path.join(self.upload_dir, unique_filename)
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        return self._public_url(unique_filename)

    def _upload_to_oss(self, file_content: bytes, filename: str, content_type: str = "image/jpeg") -> str:
        """上传文件到阿里云 OSS，返回公网 URL"""
        if not self.oss_bucket:
            raise Exception("阿里云 OSS 未配置或初始化失败")
        
        try:
            # 生成 OSS 路径
            oss_key = f"papercut/{uuid.uuid4()}_{filename}"
            
            # 上传到 OSS
            self.oss_bucket.put_object(
                oss_key,
                file_content,
                headers={'Content-Type': content_type}
            )
            
            # 返回公网 URL
            # 格式: https://bucket.endpoint/oss_key
            public_url = f"https://{settings.ALI_CLOUD_BUCKET_NAME}.{settings.ALI_CLOUD_ENDPOINT}/{oss_key}"
            
            return public_url
            
        except Exception as e:
            print(f"上传到阿里云 OSS 失败: {e}")
            raise Exception(f"上传失败: {str(e)}")

    async def upload_file(self, file_content: bytes, filename: str, file_type: str) -> str:
        try:
            # 生成唯一文件名
            unique_filename = f"{uuid.uuid4()}_{filename}"

            # 解析文件类型 (可能是 "image/jpeg" 或 "jpeg")
            if file_type:
                if '/' in file_type:
                    ext = file_type.split('/')[-1]
                else:
                    ext = file_type
            else:
                ext = 'jpeg'
            content_type = f"image/{ext}"

            # 如果配置了阿里云 OSS，上传到 OSS
            if self.oss_bucket:
                return self._upload_to_oss(file_content, unique_filename, content_type)

            # 否则保存到本地
            file_path = os.path.join(self.upload_dir, unique_filename)
            with open(file_path, 'wb') as f:
                f.write(file_content)

            return self._public_url(unique_filename)

        except Exception as e:
            print(f"上传文件失败: {e}")
            raise Exception(f"上传失败: {str(e)}")

    async def upload_media_file(self, file_content: bytes, filename: str, file_type: str) -> str:
        """上传音频等媒体文件"""
        try:
            safe_name = filename or "media.bin"
            ext = safe_name.rsplit(".", 1)[-1].lower() if "." in safe_name else "mp3"
            if ext not in ("mp3", "wav", "m4a", "aac", "mpeg"):
                ext = "mp3"
            unique_filename = f"{uuid.uuid4()}.{ext}"
            file_path = os.path.join(self.upload_dir, unique_filename)
            with open(file_path, "wb") as f:
                f.write(file_content)
            return self._public_url(unique_filename)
        except Exception as e:
            print(f"上传媒体失败: {e}")
            raise Exception(f"上传失败: {str(e)}")

    async def call_jimeng_image2image(
        self,
        image_url: str,
        prompt: str,
        seed: int = -1,
        scale: float = 0.5
    ) -> Dict[str, Any]:
        """调用即梦 AI 图生图接口"""
        try:
            # 构造请求体
            body = {
                "req_key": settings.JIMENG_REQ_KEY,
                "image_urls": [image_url],
                "prompt": prompt,
                "seed": seed,
                "scale": scale
            }
            
            body_str = json.dumps(body)
            
            # 构造查询参数
            query_params = {
                "Action": "CVProcess",
                "Version": settings.JIMENG_VERSION
            }
            
            # 获取签名
            headers = get_signature(
                "POST",
                "/",
                query_params,
                body_str,
                settings.JIMENG_ACCESS_KEY,
                settings.JIMENG_SECRET_KEY
            )
            
            # 发送请求
            query_str = "&".join([f"{k}={v}" for k, v in sorted(query_params.items())])
            url = f"{settings.JIMENG_ENDPOINT}/?{query_str}"
            
            print(f"发送请求到即梦 AI: {url}")
            print(f"请求体: {body_str}")
            print(f"请求头: {headers}")
            
            response = requests.post(url, headers=headers, data=body_str)
            
            print(f"即梦 AI 响应状态码: {response.status_code}")
            response_text = response.text
            print(f"即梦 AI 响应内容: {response_text[:500]}")
            
            # 直接返回即梦 AI 的原始响应
            try:
                result = json.loads(response_text)
                return result
            except json.JSONDecodeError:
                return {
                    "code": 500,
                    "message": response_text
                }

        except Exception as e:
            print(f"调用即梦 AI 失败: {e}")
            return {
                "code": 500,
                "message": str(e)
            }

    async def generate_papercut(
        self,
        original_image_url: str,
        width: int = 1080,
        height: int = 1080
    ) -> Dict[str, Any]:
        """生成红色剪纸风格图片（本地算法保底，即梦成功时优先用即梦）"""
        print(f"开始生成红色剪纸，原始图片: {original_image_url}")
        source_bytes = self._fetch_image_bytes(original_image_url)
        papercut_bytes = None
        source = "local_red_papercut"

        if (
            self._is_public_url(original_image_url)
            and settings.JIMENG_ACCESS_KEY
            and settings.JIMENG_SECRET_KEY
        ):
            prompt = "中国红色剪纸艺术，镂空剪纸，单色红色，白色背景，传统民间剪纸风格"
            jimeng_result = await self.call_jimeng_image2image(
                image_url=original_image_url,
                prompt=prompt,
                seed=-1,
                scale=0.5,
            )
            print(f"即梦 AI 返回 code: {jimeng_result.get('code')}")
            if jimeng_result.get("code") == 10000:
                binary_list = jimeng_result.get("data", {}).get("binary_data_base64", [])
                if binary_list:
                    papercut_bytes = base64.b64decode(binary_list[0])
                    source = "jimeng"

        if not papercut_bytes:
            print("使用本地红色剪纸滤镜处理")
            papercut_bytes = bytes_to_red_papercut(source_bytes)

        papercut_url = self._save_papercut_bytes(papercut_bytes)
        return {
            "code": 200,
            "msg": "生成成功",
            "data": {
                "papercutImageUrl": papercut_url,
                "task_id": str(uuid.uuid4()),
                "source": source,
            },
        }

    async def crop_image(
        self,
        image_url: str,
        x: int,
        y: int,
        width: int,
        height: int
    ) -> str:
        """裁剪图片"""
        try:
            image = Image.open(BytesIO(self._fetch_image_bytes(image_url)))
            
            # 裁剪
            cropped = image.crop((x, y, x + width, y + height))
            
            # 保存
            unique_filename = f"cropped_{uuid.uuid4()}.jpg"
            
            # 如果配置了阿里云 OSS，上传到 OSS
            if self.oss_bucket:
                # 将 PIL Image 转换为 bytes
                buffer = BytesIO()
                cropped.save(buffer, format='JPEG', quality=95)
                buffer.seek(0)
                return self._upload_to_oss(buffer.read(), unique_filename, "image/jpeg")
            else:
                # 保存到本地
                file_path = os.path.join(self.upload_dir, unique_filename)
                cropped.save(file_path, quality=95)
                return self._public_url(unique_filename)
            
        except Exception as e:
            print(f"裁剪图片失败: {e}")
            raise Exception(f"裁剪失败: {str(e)}")

    async def compose_images(
        self,
        papercut_image_url: str,
        background_image_url: Optional[str] = None,
        background_music_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """合成最终作品"""
        try:
            print(f"[合成] 开始合成，剪纸图片: {papercut_image_url}")
            print(f"[合成] 背景图片: {background_image_url}")
            print(f"[合成] 背景音乐: {background_music_url}")
            
            papercut_image = Image.open(BytesIO(self._fetch_image_bytes(papercut_image_url)))
            print(f"[合成] 剪纸图片尺寸: {papercut_image.size}, 模式: {papercut_image.mode}")
            
            if background_image_url:
                print(f"[合成] 下载背景图片: {background_image_url}")
                background_image = Image.open(BytesIO(self._fetch_image_bytes(background_image_url)))
                print(f"[合成] 背景图片尺寸: {background_image.size}, 模式: {background_image.mode}")
                
                # 调整剪纸图片大小（缩小到背景的80%）
                max_papercut_width = int(background_image.width * 0.8)
                max_papercut_height = int(background_image.height * 0.8)
                
                # 计算缩放比例
                scale_x = max_papercut_width / (papercut_image.width or 1080)
                scale_y = max_papercut_height / (papercut_image.height or 1080)
                scale = min(scale_x, scale_y, 1)  # 不放大，只缩小
                
                if scale < 1:
                    resized_width = int((papercut_image.width or 1080) * scale)
                    resized_height = int((papercut_image.height or 1080) * scale)
                    papercut_image = papercut_image.resize(
                        (resized_width, resized_height),
                        Image.LANCZOS
                    )
                
                # 居中合成
                x = (background_image.width - papercut_image.width) // 2
                y = (background_image.height - papercut_image.height) // 2
                
                if papercut_image.mode in ('RGBA', 'LA'):
                    background_image.paste(papercut_image, (x, y), papercut_image)
                else:
                    background_image.paste(papercut_image, (x, y))
                
                final_image = background_image
            else:
                final_image = papercut_image
            
            # 保存最终图片
            unique_filename = f"composed_{uuid.uuid4()}.jpg"
            print(f"[合成] 保存最终图片: {unique_filename}")
            
            # 如果图片是RGBA模式，转换为RGB（JPEG不支持透明通道）
            if final_image.mode == 'RGBA':
                print(f"[合成] 检测到RGBA模式，转换为RGB")
                # 创建白色背景
                background = Image.new('RGB', final_image.size, (255, 255, 255))
                background.paste(final_image, mask=final_image.split()[3])
                final_image = background
            elif final_image.mode != 'RGB':
                print(f"[合成] 图片模式: {final_image.mode}，转换为RGB")
                final_image = final_image.convert('RGB')
            
            # 如果配置了阿里云 OSS，上传到 OSS
            if self.oss_bucket:
                # 将 PIL Image 转换为 bytes
                buffer = BytesIO()
                final_image.save(buffer, format='JPEG', quality=95)
                buffer.seek(0)
                composed_url = self._upload_to_oss(buffer.read(), unique_filename, "image/jpeg")
            else:
                # 保存到本地
                file_path = os.path.join(self.upload_dir, unique_filename)
                final_image.save(file_path, quality=95)
                # 返回完整URL
                composed_url = self._public_url(unique_filename)
            
            result_data = {
                "code": 200,
                "msg": "合成成功",
                "data": {
                    "composedImage": composed_url,
                    "backgroundMusicUrl": background_music_url or ""
                }
            }
            print(f"[合成] 返回结果: {result_data}")
            return result_data
            
        except Exception as e:
            print(f"[合成] 失败: {e}")
            import traceback
            traceback.print_exc()
            raise Exception(f"合成失败: {str(e)}")


# 创建服务实例
papercut_service = PaperCutService()
