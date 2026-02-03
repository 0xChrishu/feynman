"""
统一配置管理
从环境变量加载配置，提供默认值和验证
"""
import os
from dotenv import load_dotenv
from typing import Optional

# 加载 .env 文件
load_dotenv()


class Config:
    """应用配置类"""

    # LLM 配置
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv(
        "LLM_BASE_URL",
        "https://dashscope.aliyuncs.com/compatible-mode/v1"
    )
    LLM_MODEL: str = os.getenv("LLM_MODEL", "qwen-plus")

    # JWT 配置
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 天

    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./learning_coach.db")

    # 应用配置
    APP_NAME: str = "Learning Coach"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS 配置
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173"
    ).split(",")

    @classmethod
    def validate(cls) -> None:
        """验证必需的配置项"""
        errors = []

        if not cls.LLM_API_KEY or cls.LLM_API_KEY == "your_api_key_here":
            errors.append("LLM_API_KEY 未配置或使用默认值")

        if not cls.JWT_SECRET_KEY or cls.JWT_SECRET_KEY == "change_this_in_production":
            errors.append("JWT_SECRET_KEY 未配置或使用默认值")

        if errors and not cls.DEBUG:
            raise ValueError(f"配置错误: {', '.join(errors)}")

    @classmethod
    def print_config(cls) -> None:
        """打印当前配置（隐藏敏感信息）"""
        import logging

        logging.info(f"{cls.APP_NAME} 配置:")
        logging.info(f"  LLM Base URL: {cls.LLM_BASE_URL}")
        logging.info(f"  LLM Model: {cls.LLM_MODEL}")
        logging.info(f"  API Key: {'***' + cls.LLM_API_KEY[-4:] if cls.LLM_API_KEY else '未配置'}")
        logging.info(f"  Database: {cls.DATABASE_URL}")
        logging.info(f"  Debug: {cls.DEBUG}")


# 创建配置实例
config = Config()


def get_config() -> Config:
    """获取配置实例"""
    return config
