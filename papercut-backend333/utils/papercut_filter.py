"""
本地红色剪纸风格处理（即梦 API 不可用时的可靠方案）
"""
from io import BytesIO
from PIL import Image, ImageOps, ImageFilter, ImageEnhance

PAPER_RED = (200, 22, 29)
PAPER_BG = (255, 250, 245)


def apply_red_papercut(image: Image.Image) -> Image.Image:
    """将照片转为红白剪纸风格（红色图案 + 浅色底）"""
    img = image.convert("RGB")
    w, h = img.size
    if max(w, h) > 1024:
        img.thumbnail((1024, 1024), Image.LANCZOS)

    gray = ImageOps.grayscale(img)
    gray = ImageEnhance.Contrast(gray).enhance(1.6)
    gray = gray.filter(ImageFilter.SHARPEN)

    pixels = list(gray.getdata())
    if not pixels:
        return img
    sorted_px = sorted(pixels)
    median = sorted_px[len(sorted_px) // 2]
    threshold = int(max(70, min(median * 0.85, 165)))

    gw, gh = gray.size
    out = Image.new("RGB", (gw, gh), PAPER_BG)
    src = gray.load()
    dst = out.load()
    for y in range(gh):
        for x in range(gw):
            if src[x, y] < threshold:
                dst[x, y] = PAPER_RED

    return out.filter(ImageFilter.SMOOTH_MORE)


def bytes_to_red_papercut(image_bytes: bytes) -> bytes:
    image = Image.open(BytesIO(image_bytes))
    result = apply_red_papercut(image)
    buf = BytesIO()
    result.save(buf, format="JPEG", quality=92)
    return buf.getvalue()
