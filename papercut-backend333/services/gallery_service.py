"""
社区模块服务 - 作品展示、点赞、收藏、关注
"""
try:
    import sqlite3
except ImportError:
    import pysqlite3 as sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any


class GalleryService:
    def __init__(self):
        # 使用项目根目录下的数据库文件
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "gallery.db")
        self.init_db()

    def init_db(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''CREATE TABLE IF NOT EXISTS works (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            image TEXT,
            likes INTEGER DEFAULT 0,
            collects INTEGER DEFAULT 0,
            type TEXT
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            follower TEXT,
            following TEXT
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            work_id INTEGER
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS collects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            work_id INTEGER
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS not_interested (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            work_id INTEGER
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_id INTEGER,
            username TEXT,
            content TEXT,
            create_time TEXT
        )''')

        conn.commit()
        conn.close()

    def get_works(self) -> List[Dict[str, Any]]:
        """获取全部作品"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT id, title, author, image, likes, collects FROM works WHERE type='classic'")
        rows = c.fetchall()
        works = []
        for r in rows:
            c.execute("SELECT COUNT(*) FROM comments WHERE work_id=?", (r[0],))
            comment_count = c.fetchone()[0]
            works.append({
                "id": r[0], "title": r[1], "author": r[2], "image": r[3],
                "likes": r[4], "collects": r[5], "commentCount": comment_count
            })
        conn.close()
        return works

    def get_author_info(self, author_name: str) -> Dict[str, Any]:
        """获取作者统计信息"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        # 作品总数
        c.execute("SELECT COUNT(*) FROM works WHERE author=?", (author_name,))
        work_total = c.fetchone()[0]
        # 粉丝数
        c.execute("SELECT COUNT(DISTINCT follower) FROM follows WHERE following=?", (author_name,))
        fan_total = c.fetchone()[0]
        # 关注数
        c.execute("SELECT COUNT(DISTINCT following) FROM follows WHERE follower=?", (author_name,))
        follow_total = c.fetchone()[0]
        conn.close()
        return {
            "author": author_name,
            "workTotal": work_total,
            "fanTotal": fan_total,
            "followTotal": follow_total
        }

    def get_author_works(self, author_name: str) -> List[Dict[str, Any]]:
        """获取指定作者的所有作品"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT id, title, author, image, likes, collects FROM works WHERE author=?", (author_name,))
        rows = c.fetchall()
        works = []
        for r in rows:
            c.execute("SELECT COUNT(*) FROM comments WHERE work_id=?", (r[0],))
            comment_count = c.fetchone()[0]
            works.append({
                "id": r[0], "title": r[1], "author": r[2], "image": r[3],
                "likes": r[4], "collects": r[5], "commentCount": comment_count
            })
        conn.close()
        return works

    def get_work_detail(self, work_id: int) -> Dict[str, Any]:
        """单个作品详情"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT id, title, author, image, likes, collects FROM works WHERE id=?", (work_id,))
        work = c.fetchone()
        if not work:
            return {}
        c.execute("SELECT COUNT(*) FROM comments WHERE work_id=?", (work_id,))
        comment_count = c.fetchone()[0]
        conn.close()
        return {
            "id": work[0], "title": work[1], "author": work[2], "image": work[3],
            "likes": work[4], "collects": work[5], "commentCount": comment_count
        }

    def search(self, keyword: str) -> List[Dict[str, Any]]:
        """搜索作品"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            SELECT id, title, author, image, likes, collects FROM works
            WHERE (title LIKE ? OR author LIKE ?) AND type='classic'
        ''', (f"%{keyword}%", f"%{keyword}%"))
        rows = c.fetchall()
        res = []
        for r in rows:
            c.execute("SELECT COUNT(*) FROM comments WHERE work_id=?", (r[0],))
            cnt = c.fetchone()[0]
            res.append({
                "id": r[0], "title": r[1], "author": r[2], "image": r[3],
                "likes": r[4], "collects": r[5], "commentCount": cnt
            })
        conn.close()
        return res

    def like(self, work_id: int, username: str) -> Dict[str, str]:
        """点赞/取消点赞"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT * FROM likes WHERE username=? AND work_id=?", (username, work_id))
        exist = c.fetchone()
        if exist:
            c.execute("DELETE FROM likes WHERE username=? AND work_id=?", (username, work_id))
            c.execute("UPDATE works SET likes = likes - 1 WHERE id=?", (work_id,))
        else:
            c.execute("INSERT INTO likes (username,work_id) VALUES (?,?)", (username, work_id))
            c.execute("UPDATE works SET likes = likes + 1 WHERE id=?", (work_id,))
        conn.commit()
        conn.close()
        return {"status": "ok"}

    def is_liked(self, username: str, work_id: int) -> bool:
        """检查是否已点赞"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT * FROM likes WHERE username=? AND work_id=?", (username, work_id))
        exist = c.fetchone()
        conn.close()
        return exist is not None

    def collect(self, work_id: int, username: str) -> Dict[str, Any]:
        """收藏/取消收藏，返回当前状态与作品信息"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT * FROM collects WHERE username=? AND work_id=?", (username, work_id))
        exist = c.fetchone()
        if exist:
            c.execute("DELETE FROM collects WHERE username=? AND work_id=?", (username, work_id))
            c.execute(
                "UPDATE works SET collects = CASE WHEN collects > 0 THEN collects - 1 ELSE 0 END WHERE id=?",
                (work_id,),
            )
            collected = False
        else:
            c.execute("INSERT INTO collects (username,work_id) VALUES (?,?)", (username, work_id))
            c.execute("UPDATE works SET collects = collects + 1 WHERE id=?", (work_id,))
            collected = True
        conn.commit()
        conn.close()
        work = self.get_work_detail(work_id) if collected else None
        return {"status": "ok", "collected": collected, "work": work}

    def get_user_collects(self, username: str) -> List[Dict[str, Any]]:
        """获取用户收藏的作品列表"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute(
            """
            SELECT w.id, w.title, w.author, w.image, w.likes, w.collects
            FROM works w
            INNER JOIN collects col ON col.work_id = w.id
            WHERE col.username=?
            ORDER BY col.id DESC
            """,
            (username,),
        )
        rows = c.fetchall()
        works = []
        for r in rows:
            c.execute("SELECT COUNT(*) FROM comments WHERE work_id=?", (r[0],))
            comment_count = c.fetchone()[0]
            works.append({
                "id": r[0],
                "title": r[1],
                "author": r[2],
                "image": r[3],
                "likes": r[4],
                "collects": r[5],
                "commentCount": comment_count,
            })
        conn.close()
        return works

    def is_collected(self, username: str, work_id: int) -> bool:
        """检查是否已收藏"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT * FROM collects WHERE username=? AND work_id=?", (username, work_id))
        exist = c.fetchone()
        conn.close()
        return exist is not None

    def follow(self, author: str, username: str) -> Dict[str, str]:
        """关注/取消关注作者"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT * FROM follows WHERE follower=? AND following=?", (username, author))
        exist = c.fetchone()
        if exist:
            c.execute("DELETE FROM follows WHERE follower=? AND following=?", (username, author))
        else:
            c.execute("INSERT INTO follows (follower,following) VALUES (?,?)", (username, author))
        conn.commit()
        conn.close()
        return {"status": "ok"}

    def is_followed(self, username: str, author: str) -> bool:
        """检查是否已关注作者"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT * FROM follows WHERE follower=? AND following=?", (username, author))
        exist = c.fetchone()
        conn.close()
        return exist is not None

    def not_interested(self, work_id: int, username: str) -> Dict[str, str]:
        """不感兴趣"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT OR IGNORE INTO not_interested (username,work_id) VALUES (?,?)", (username, work_id))
        conn.commit()
        conn.close()
        return {"status": "ok"}

    def get_comments(self, work_id: int) -> List[Dict[str, str]]:
        """获取评论"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT username, content, create_time FROM comments WHERE work_id=? ORDER BY id DESC", (work_id,))
        rows = c.fetchall()
        conn.close()
        return [{"username": r[0], "content": r[1], "time": r[2]} for r in rows]

    def add_comment(self, work_id: int, username: str, content: str) -> Dict[str, str]:
        """发表评论"""
        if not content.strip():
            return {"status": "fail", "msg": "评论不能为空"}
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT INTO comments (work_id, username, content, create_time) VALUES (?,?,?,?)",
                  (work_id, username, content, now))
        conn.commit()
        conn.close()
        return {"status": "ok"}


# 创建服务实例
gallery_service = GalleryService()
