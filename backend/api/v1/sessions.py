from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import LearningSession, User
from auth import get_current_user, get_optional_user
from datetime import datetime
import uuid

router = APIRouter()


class SessionRequest(BaseModel):
    content_type: str
    original_content: str
    question: str
    user_answer: str
    feedback: str
    score: float


@router.post("/")
async def create_session(
    request: SessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """保存学习会话"""
    session = LearningSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        content_type=request.content_type,
        original_content=request.original_content,
        question=request.question,
        user_answer=request.user_answer,
        feedback=request.feedback,
        score=request.score,
        created_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/")
async def get_sessions(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户的学习历史（分页）"""
    total = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id
    ).count()

    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id
    ).order_by(LearningSession.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "sessions": sessions,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取单个会话详情"""
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    return session
