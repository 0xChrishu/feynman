from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import FlashCard, FlashCardReview, User, LearningSession
from auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter()


class FlashCardRequest(BaseModel):
    front: str
    back: str
    session_id: Optional[str] = None


class ReviewRequest(BaseModel):
    quality: int  # 0-5
    time_spent: int = 0  # 秒


@router.post("/flashcards")
async def create_flashcard(
    request: FlashCardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新闪卡"""
    flashcard = FlashCard(
        id=FlashCard.generate_id(),
        user_id=current_user.id,
        session_id=request.session_id,
        front=request.front,
        back=request.back
    )
    db.add(flashcard)

    # 更新用户统计
    stats = current_user.statistics
    if stats:
        stats.total_flashcards += 1

    db.commit()
    db.refresh(flashcard)
    return flashcard


@router.post("/flashcards/from-session")
async def create_flashcard_from_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """从学习会话自动生成闪卡"""
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="学习会话不存在")

    # AI 生成闪卡（简化版：直接用问题做 front，答案做 back）
    flashcard = FlashCard(
        id=FlashCard.generate_id(),
        user_id=current_user.id,
        session_id=session_id,
        front=f"问题：{session.question[:100]}...",
        back=f"核心概念：{session.original_content[:200]}..."
    )

    db.add(flashcard)

    # 更新用户统计
    stats = current_user.statistics
    if stats:
        stats.total_flashcards += 1

    db.commit()
    db.refresh(flashcard)
    return flashcard


@router.get("/flashcards/due")
async def get_due_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取今日待复习的闪卡"""
    flashcards = db.query(FlashCard).filter(
        FlashCard.user_id == current_user.id,
        FlashCard.next_review_date <= datetime.utcnow()
    ).order_by(FlashCard.next_review_date).all()

    return {
        "flashcards": flashcards,
        "count": len(flashcards)
    }


@router.get("/flashcards")
async def get_all_flashcards(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有闪卡（分页）"""
    total = db.query(FlashCard).filter(
        FlashCard.user_id == current_user.id
    ).count()

    flashcards = db.query(FlashCard).filter(
        FlashCard.user_id == current_user.id
    ).order_by(FlashCard.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "flashcards": flashcards,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/flashcards/{card_id}")
async def get_flashcard(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取单张闪卡详情"""
    card = db.query(FlashCard).filter(
        FlashCard.id == card_id,
        FlashCard.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="闪卡不存在")

    return card


@router.post("/flashcards/{card_id}/review")
async def review_flashcard(
    card_id: str,
    request: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """提交复习结果"""
    card = db.query(FlashCard).filter(
        FlashCard.id == card_id,
        FlashCard.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="闪卡不存在")

    # 验证评分范围
    if not 0 <= request.quality <= 5:
        raise HTTPException(status_code=400, detail="评分必须在 0-5 之间")

    # 记录复习
    review = FlashCardReview(
        id=FlashCardReview.generate_id(),
        card_id=card_id,
        quality=request.quality,
        time_spent=request.time_spent
    )
    db.add(review)

    # 更新闪卡状态（SM-2 算法）
    card.calculate_next_review(request.quality)

    db.commit()
    db.refresh(card)

    return {
        "card": card,
        "next_review_date": card.next_review_date,
        "interval": card.interval,
        "message": get_review_feedback(request.quality)
    }


@router.delete("/flashcards/{card_id}")
async def delete_flashcard(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除闪卡"""
    card = db.query(FlashCard).filter(
        FlashCard.id == card_id,
        FlashCard.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="闪卡不存在")

    db.delete(card)

    # 更新用户统计
    stats = current_user.statistics
    if stats:
        stats.total_flashcards = max(0, stats.total_flashcards - 1)

    db.commit()
    return {"deleted": True}


@router.get("/flashcards/stats")
async def get_flashcard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取闪卡复习统计"""
    from datetime import timedelta

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 今日复习数
    reviews_today = db.query(FlashCardReview).join(FlashCard).filter(
        FlashCard.user_id == current_user.id,
        FlashCardReview.reviewed_at >= today_start
    ).count()

    # 今日待复习
    due_today = db.query(FlashCard).filter(
        FlashCard.user_id == current_user.id,
        FlashCard.next_review_date <= now
    ).count()

    # 本周复习数
    week_start = now - timedelta(days=7)
    reviews_week = db.query(FlashCardReview).join(FlashCard).filter(
        FlashCard.user_id == current_user.id,
        FlashCardReview.reviewed_at >= week_start
    ).count()

    # 总闪卡数
    total_cards = db.query(FlashCard).filter(
        FlashCard.user_id == current_user.id
    ).count()

    # 已掌握的卡片（间隔 > 30 天）
    mastered_cards = db.query(FlashCard).filter(
        FlashCard.user_id == current_user.id,
        FlashCard.interval > 30
    ).count()

    # 平均质量评分
    avg_quality = db.query(FlashCardReview.quality).join(FlashCard).filter(
        FlashCard.user_id == current_user.id
    ).all()
    avg_quality = sum(avg_quality) / len(avg_quality) if avg_quality else 0

    return {
        "total_cards": total_cards,
        "due_today": due_today,
        "reviews_today": reviews_today,
        "reviews_week": reviews_week,
        "mastered_cards": mastered_cards,
        "mastery_rate": round(mastered_cards / total_cards * 100, 1) if total_cards > 0 else 0,
        "avg_quality": round(avg_quality, 1)
    }


def get_review_feedback(quality: int) -> str:
    """根据评分返回反馈信息"""
    feedback = {
        0: "没关系，这次重新学习！",
        1: "再接再厉，继续加油！",
        2: "有点困难，多练习几次就好",
        3: "还可以，继续保持",
        4: "很棒！记得得不错",
        5: "完美！已经完全掌握了！"
    }
    return feedback.get(quality, "")
