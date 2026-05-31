"""
社区模块路由 - 作品展示、点赞、收藏、关注
"""
from fastapi import APIRouter, Query
from services.gallery_service import gallery_service

router = APIRouter(prefix="/api/community", tags=["社区"])


@router.get("/works")
async def get_works():
    """获取全部作品"""
    return gallery_service.get_works()


@router.get("/author/info/{author_name}")
async def get_author_info(author_name: str):
    """获取作者统计信息：作品数、粉丝数、关注数"""
    return gallery_service.get_author_info(author_name)


@router.get("/author/works/{author_name}")
async def get_author_works(author_name: str):
    """获取指定作者的所有作品"""
    return gallery_service.get_author_works(author_name)


@router.get("/work/{work_id}")
async def get_work_detail(work_id: int):
    """单个作品详情"""
    return gallery_service.get_work_detail(work_id)


@router.get("/search")
async def search(keyword: str = Query(...)):
    """搜索作品"""
    return gallery_service.search(keyword)


@router.post("/like/{work_id}")
async def like(work_id: int, username: str = "user"):
    """点赞/取消点赞"""
    return gallery_service.like(work_id, username)


@router.get("/is-liked")
async def is_liked(username: str = Query(...), work_id: int = Query(...)):
    """检查是否已点赞"""
    return {"liked": gallery_service.is_liked(username, work_id)}


@router.post("/collect/{work_id}")
async def collect(work_id: int, username: str = Query("user")):
    """收藏/取消收藏"""
    return gallery_service.collect(work_id, username)


@router.get("/my-collects")
async def my_collects(username: str = Query(...)):
    """我的收藏列表（与社区收藏同步）"""
    return gallery_service.get_user_collects(username)


@router.get("/is-collected")
async def is_collected(username: str = Query(...), work_id: int = Query(...)):
    """检查是否已收藏"""
    return {"collected": gallery_service.is_collected(username, work_id)}


@router.post("/follow/{author}")
async def follow(author: str, username: str = Query("user")):
    """关注/取消关注作者"""
    return gallery_service.follow(author, username)


@router.get("/is-followed")
async def is_followed(username: str = Query(...), author: str = Query(...)):
    """检查是否已关注作者"""
    return {"followed": gallery_service.is_followed(username, author)}


@router.post("/not-interested/{work_id}")
async def not_interested(work_id: int, username: str = "user"):
    """不感兴趣"""
    return gallery_service.not_interested(work_id, username)


@router.get("/comments/{work_id}")
async def get_comments(work_id: int):
    """获取评论"""
    return gallery_service.get_comments(work_id)


@router.post("/comment/{work_id}")
async def add_comment(work_id: int, username: str = "user", content: str = ""):
    """发表评论"""
    return gallery_service.add_comment(work_id, username, content)
