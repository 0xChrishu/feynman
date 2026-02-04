from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import LearningSession, UserStatistics, User
from auth import get_current_user

router = APIRouter()


@router.get("/overview")
async def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户学习统计概览"""
    # Get or update user statistics
    stats = db.query(UserStatistics).filter(
        UserStatistics.user_id == current_user.id
    ).first()

    if not stats:
        # Calculate initial statistics
        sessions = db.query(LearningSession).filter(
            LearningSession.user_id == current_user.id
        ).all()

        total_sessions = len(sessions)
        avg_score = sum(s.score for s in sessions) / total_sessions if total_sessions > 0 else 0
        best_score = max((s.score for s in sessions), default=0)

        stats = UserStatistics(
            user_id=current_user.id,
            total_sessions=total_sessions,
            avg_score=avg_score,
            best_score=best_score
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)

    return {
        "total_sessions": stats.total_sessions,
        "avg_score": stats.avg_score,
        "best_score": stats.best_score
    }


@router.get("/chart")
async def get_chart_data(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取图表数据 - 学习趋势"""
    from datetime import datetime, timedelta

    start_date = datetime.utcnow() - timedelta(days=days)

    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.created_at >= start_date
    ).order_by(LearningSession.created_at).all()

    # Group by date
    chart_data = {}
    for session in sessions:
        date_key = session.created_at.strftime("%Y-%m-%d")
        if date_key not in chart_data:
            chart_data[date_key] = {"count": 0, "scores": []}
        chart_data[date_key]["count"] += 1
        chart_data[date_key]["scores"].append(session.score)

    # Format for frontend
    formatted_data = [
        {
            "date": date,
            "count": data["count"],
            "avg_score": sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0
        }
        for date, data in sorted(chart_data.items())
    ]

    return formatted_data
