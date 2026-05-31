"""
从 uploads 目录初始化社区作品（使用真实图片）
"""
try:
    import sqlite3
except ImportError:
    import pysqlite3 as sqlite3
import os

from config import settings

DB_PATH = os.path.join(os.path.dirname(__file__), "gallery.db")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), settings.UPLOAD_DIR)
BASE = settings.PUBLIC_BASE_URL.rstrip("/")

# 优先使用的展示图（需在 uploads 目录存在）
WORK_SEEDS = [
    (1, "福字剪纸", "张三", "1.jpg", 128, 56),
    (2, "窗花艺术", "李四", "2.jpg", 256, 89),
    (3, "喜字剪纸", "王五", "3.jpg", 89, 34),
    (4, "龙凤呈祥", "张三", "composed_1.jpg", 512, 128),
    (5, "年年有余", "李四", "composed_2.jpg", 345, 78),
]


def _pick_extra_images(used_names: set) -> list:
    extras = []
    if not os.path.isdir(UPLOADS_DIR):
        return extras
    for name in sorted(os.listdir(UPLOADS_DIR)):
        low = name.lower()
        if name in used_names:
            continue
        if not low.endswith((".jpg", ".jpeg", ".png", ".webp")):
            continue
        extras.append(name)
    return extras[:3]


def init_data():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("DELETE FROM works")
    c.execute("DELETE FROM likes")
    c.execute("DELETE FROM collects")
    c.execute("DELETE FROM follows")
    c.execute("DELETE FROM comments")
    c.execute("DELETE FROM not_interested")

    works = []
    used_files = set()

    for wid, title, author, fname, likes, collects in WORK_SEEDS:
        fpath = os.path.join(UPLOADS_DIR, fname)
        if not os.path.isfile(fpath):
            print(f"Skip missing: {fname}")
            continue
        used_files.add(fname)
        works.append(
            (wid, title, author, f"{BASE}/uploads/{fname}", likes, collects, "classic")
        )

    next_id = len(works) + 1
    for fname in _pick_extra_images(used_files):
        works.append(
            (
                next_id,
                f"剪纸作品 {next_id}",
                "剪韵用户",
                f"{BASE}/uploads/{fname}",
                66,
                22,
                "classic",
            )
        )
        next_id += 1

    if not works:
        print("No images in uploads folder, nothing inserted.")
        conn.close()
        return

    c.executemany(
        """
        INSERT INTO works (id, title, author, image, likes, collects, type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        works,
    )

    comments = [
        (1, works[0][0], "user1", "真漂亮！", "2024-01-15 10:30"),
        (2, works[0][0], "user2", "剪得真好", "2024-01-15 11:20"),
    ]
    if len(works) > 1:
        comments.append((3, works[1][0], "user1", "喜欢这个设计", "2024-01-16 09:15"))

    c.executemany(
        """
        INSERT INTO comments (id, work_id, username, content, create_time)
        VALUES (?, ?, ?, ?, ?)
        """,
        comments,
    )

    conn.commit()
    conn.close()
    print("Gallery DB initialized from uploads.")
    print(f"Works: {len(works)}, base URL: {BASE}")


if __name__ == "__main__":
    init_data()
