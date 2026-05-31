"""
用户服务 - 账号注册与登录（SQLite 持久化）
"""
import hashlib
import os
try:
    import sqlite3
except ImportError:
    import pysqlite3 as sqlite3
import time
from typing import Any, Dict, Optional


class UserService:
    def __init__(self):
        self.db_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "users.db"
        )
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute(
            """CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                nickname TEXT,
                avatar_url TEXT DEFAULT '',
                created_at TEXT
            )"""
        )
        conn.commit()
        conn.close()

    @staticmethod
    def _hash_password(password: str) -> str:
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def register(
        self, username: str, password: str, nickname: Optional[str] = None
    ) -> Dict[str, Any]:
        username = (username or "").strip()
        password = password or ""
        if not username or not password:
            return {"ok": False, "msg": "用户名和密码不能为空"}
        if len(username) < 3:
            return {"ok": False, "msg": "用户名至少 3 个字符"}
        if len(password) < 6:
            return {"ok": False, "msg": "密码至少 6 位"}

        nickname = (nickname or username).strip()
        now = time.strftime("%Y-%m-%d %H:%M:%S")
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        try:
            c.execute(
                "INSERT INTO users (username, password_hash, nickname, created_at) VALUES (?,?,?,?)",
                (username, self._hash_password(password), nickname, now),
            )
            conn.commit()
            user_id = c.lastrowid
            return {
                "ok": True,
                "msg": "注册成功",
                "user": {
                    "id": user_id,
                    "username": username,
                    "nickname": nickname,
                },
            }
        except sqlite3.IntegrityError:
            return {"ok": False, "msg": "用户名已存在"}
        finally:
            conn.close()

    def login_by_account(self, username: str, password: str) -> Dict[str, Any]:
        username = (username or "").strip()
        if not username or not password:
            return {"ok": False, "msg": "请输入用户名和密码"}

        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute(
            "SELECT id, username, password_hash, nickname, avatar_url FROM users WHERE username=?",
            (username,),
        )
        row = c.fetchone()
        conn.close()

        if not row:
            return {"ok": False, "msg": "用户不存在，请先注册"}
        if row[2] != self._hash_password(password):
            return {"ok": False, "msg": "密码错误"}

        token = hashlib.md5(
            f"{row[1]}{time.time()}".encode("utf-8")
        ).hexdigest()
        return {
            "ok": True,
            "msg": "登录成功",
            "token": token,
            "userInfo": {
                "id": row[0],
                "username": row[1],
                "nickname": row[3],
                "avatarUrl": row[4] or "",
            },
        }


user_service = UserService()
