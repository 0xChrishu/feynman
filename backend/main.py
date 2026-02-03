import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import uvicorn
from sqlalchemy.orm import Session

from database import get_db, init_db
from models import User, LearningSession, UserStatistics
from auth import create_access_token, get_current_user, get_optional_user
from llm_providers import get_available_providers, get_llm_client

load_dotenv()

app = FastAPI(title="Learning Coach API")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ContentRequest(BaseModel):
    type: str  # 'text' or 'url'
    content: str
    provider: Optional[str] = None  # AI 服务商


def extract_text_from_url(url: str) -> str:
    """Extract text content from a URL, with special handling for WeChat articles."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Specific logic for WeChat Official Account articles
        content_div = soup.find(id="js_content")
        if content_div:
            return content_div.get_text(strip=True)

        return soup.get_text(strip=True)[:10000]
    except Exception as e:
        print(f"Error fetching URL: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")


@app.post("/api/generate-question")
async def generate_question(request: ContentRequest):
    """Generate a Socratic question based on the input content."""
    text = request.content
    if request.type == 'url':
        text = extract_text_from_url(request.content)

    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from content")

    # Limit text length
    if len(text) > 15000:
        text = text[:15000]

    # Get LLM client based on provider
    client, model = get_llm_client(request.provider)

    system_prompt = (
        "你是一个'费曼教练'。你的目标是通过教学来帮助用户学习。"
        "用户会提供一段文本。"
        "1. 绝对不要直接总结这段文本。"
        "2. 识别核心概念或逻辑。"
        "3. 生成一个具有挑战性的苏格拉底式问题，要求用户用大白话解释核心概念（例如：'请把这个核心逻辑，讲给一个 5 岁的孩子听'）。"
        "仅输出问题文本，不要包含其他对话填充词。必须使用中文回答。"
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ]
        )
        question = response.choices[0].message.content
        return {"question": question, "original_content": text}
    except Exception as e:
        print(f"LLM Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/evaluate-answer")
async def evaluate_answer(
    file: Optional[UploadFile] = File(None),
    answer_text: Optional[str] = Form(None),
    original_content: str = Form(...),
    provider: Optional[str] = Form(None)
):
    """Evaluate the user's answer and provide feedback with a score."""
    user_answer = answer_text

    if not user_answer:
        raise HTTPException(status_code=400, detail="未提供回答")

    # Get LLM client based on provider
    client, model = get_llm_client(provider)

    system_prompt = (
        "你是一个'费曼教练'。请对比用户的解释与原文。"
        "1. 识别误解或遗漏的关键点。"
        "2. 提供建设性的反馈。"
        "3. 给出一个 0-100 的'掌握度评分'。"
        "以 JSON 格式返回结果，包含键：'feedback' (string), 'score' (number), 'transcription' (string - 用户的回答)。确保 feedback 使用中文。"
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Original Text: {original_content}\n\nUser Answer: {user_answer}"}
            ],
            response_format={"type": "json_object"}
        )

        result_json = response.choices[0].message.content
        result = json.loads(result_json)

        if 'transcription' not in result:
            result['transcription'] = user_answer

        return result
    except Exception as e:
        print(f"Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Auth API ==========

class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/api/auth/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    user = User(
        id=User.generate_id(),
        email=request.email,
        password_hash=User.hash_password(request.password),
        display_name=request.display_name or request.email.split("@")[0]
    )
    db.add(user)

    # Create statistics
    stats = UserStatistics(user_id=user.id)
    db.add(stats)

    db.commit()

    # Generate token
    token = create_access_token({"sub": user.id})

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name
        },
        "token": token
    }


@app.post("/api/auth/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.verify_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name
        },
        "token": token
    }


@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name
    }


# ========== Sessions API ==========

class SaveSessionRequest(BaseModel):
    content_type: str
    original_content: str
    question: str
    user_answer: str
    feedback: str
    score: float


@app.post("/api/sessions")
async def save_session(request: SaveSessionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Save a learning session."""
    session = LearningSession(
        id=LearningSession.generate_id(),
        user_id=current_user.id,
        content_type=request.content_type,
        original_content=request.original_content,
        question=request.question,
        user_answer=request.user_answer,
        feedback=request.feedback,
        score=request.score
    )
    db.add(session)

    # Update statistics
    stats = db.query(UserStatistics).filter(UserStatistics.user_id == current_user.id).first()
    if stats:
        stats.total_sessions += 1
        # Update average score
        total_score = (stats.avg_score or 0) * (stats.total_sessions - 1) + request.score
        stats.avg_score = total_score / stats.total_sessions
        if request.score > (stats.best_score or 0):
            stats.best_score = request.score

    db.commit()

    return {"id": session.id, "saved": True}


@app.get("/api/sessions")
async def get_sessions(page: int = 1, limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's learning sessions."""
    offset = (page - 1) * limit
    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id
    ).order_by(LearningSession.created_at.desc()).offset(offset).limit(limit).all()

    total = db.query(LearningSession).filter(LearningSession.user_id == current_user.id).count()

    return {
        "sessions": [
            {
                "id": s.id,
                "question": s.question,
                "score": s.score,
                "created_at": s.created_at.isoformat()
            }
            for s in sessions
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific session."""
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "content_type": session.content_type,
        "original_content": session.original_content,
        "question": session.question,
        "user_answer": session.user_answer,
        "feedback": session.feedback,
        "score": session.score,
        "created_at": session.created_at.isoformat()
    }


# ========== Statistics API ==========

@app.get("/api/statistics/overview")
async def get_statistics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's learning statistics."""
    stats = db.query(UserStatistics).filter(UserStatistics.user_id == current_user.id).first()

    if not stats:
        return {
            "total_sessions": 0,
            "avg_score": 0,
            "best_score": 0
        }

    return {
        "total_sessions": stats.total_sessions,
        "avg_score": stats.avg_score,
        "best_score": stats.best_score
    }


@app.get("/api/llm/providers")
async def get_llm_providers():
    """获取可用的 AI 模型服务商列表"""
    return {"providers": get_available_providers()}


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
