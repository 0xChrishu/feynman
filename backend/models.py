from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from database import Base
import hashlib
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    display_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("LearningSession", back_populates="user", cascade="all, delete-orphan")
    statistics = relationship("UserStatistics", back_populates="user", uselist=False, cascade="all, delete-orphan")
    flashcards = relationship("FlashCard", back_populates="user", cascade="all, delete-orphan")

    @staticmethod
    def hash_password(password: str) -> str:
        """Simple password hashing using SHA-256 (for demo, use bcrypt in production)."""
        return hashlib.sha256(password.encode()).hexdigest()

    def verify_password(self, password: str) -> bool:
        """Verify password against hash."""
        return self.password_hash == self.hash_password(password)

    @staticmethod
    def generate_id() -> str:
        """Generate a simple user ID."""
        return str(uuid.uuid4())


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    content_type = Column(String(20))  # 'text' or 'url'
    original_content = Column(Text)
    question = Column(Text)
    user_answer = Column(Text)
    feedback = Column(Text)
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    flashcards = relationship("FlashCard", back_populates="session", cascade="all, delete-orphan")

    @staticmethod
    def generate_id() -> str:
        return str(uuid.uuid4())


class FlashCard(Base):
    """闪卡模型 - 用于间隔重复学习"""
    __tablename__ = "flashcards"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String, ForeignKey("learning_sessions.id"), nullable=True, index=True)
    front = Column(Text, nullable=False)  # 问题/提示
    back = Column(Text, nullable=False)   # 答案/核心概念

    # SuperMemo SM-2 算法参数
    ease_factor = Column(Float, default=2.5)  # 难度系数 (1.3 - inf)
    interval = Column(Integer, default=0)       # 当前间隔天数
    repetitions = Column(Integer, default=0)    # 复习次数
    next_review_date = Column(DateTime, default=datetime.utcnow, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="flashcards")
    session = relationship("LearningSession", back_populates="flashcards")
    reviews = relationship("FlashCardReview", back_populates="card", cascade="all, delete-orphan")

    @staticmethod
    def generate_id() -> str:
        return str(uuid.uuid4())

    def calculate_next_review(self, quality: int):
        """
        SuperMemo SM-2 算法计算下次复习时间

        Args:
            quality: 0-5 用户评分
                0: 完全忘记
                1: 错误但有印象
                2: 困难回忆
                3: 勉强回忆
                4: 轻松回忆
                5: 完全掌握
        """
        if quality < 3:
            # 回答错误，重置
            self.repetitions = 0
            self.interval = 1
        else:
            # 回答正确，增加间隔
            if self.repetitions == 0:
                self.interval = 1
            elif self.repetitions == 1:
                self.interval = 6
            else:
                self.interval = int(self.interval * self.ease_factor)

            self.repetitions += 1

        # 更新难度系数
        self.ease_factor = max(1.3, self.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

        # 计算下次复习日期
        self.next_review_date = datetime.utcnow() + timedelta(days=self.interval)
        self.updated_at = datetime.utcnow()

        return self

    @property
    def is_due(self) -> bool:
        """检查是否到期需要复习"""
        return datetime.utcnow() >= self.next_review_date


class FlashCardReview(Base):
    """闪卡复习记录"""
    __tablename__ = "flashcard_reviews"

    id = Column(String, primary_key=True)
    card_id = Column(String, ForeignKey("flashcards.id"), nullable=False, index=True)
    quality = Column(Integer, nullable=False)  # 0-5: 用户评分
    time_spent = Column(Integer, default=0)     # 花费时间（秒）
    reviewed_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    card = relationship("FlashCard", back_populates="reviews")

    @staticmethod
    def generate_id() -> str:
        return str(uuid.uuid4())


class UserStatistics(Base):
    __tablename__ = "user_statistics"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    total_sessions = Column(Integer, default=0)
    avg_score = Column(Float)
    best_score = Column(Float)
    total_flashcards = Column(Integer, default=0)  # 总闪卡数
    cards_due_today = Column(Integer, default=0)   # 今日待复习
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="statistics")
