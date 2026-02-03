from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import hashlib


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
        import uuid
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

    @staticmethod
    def generate_id() -> str:
        import uuid
        return str(uuid.uuid4())


class UserStatistics(Base):
    __tablename__ = "user_statistics"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    total_sessions = Column(Integer, default=0)
    avg_score = Column(Float)
    best_score = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="statistics")
