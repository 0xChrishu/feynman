"""
AI 模型服务商配置
支持多个免费 AI API
"""
from typing import Dict, List
from openai import OpenAI
import os

# AI 服务商配置
AI_PROVIDERS: Dict[str, Dict] = {
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com",
        "model": "deepseek-chat",
        "description": "免费 500万 tokens/天，性能优秀",
        "api_key_env": "DEEPSEEK_API_KEY",
        "default": True
    },
    "groq": {
        "name": "Groq",
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
        "description": "完全免费，速度极快",
        "api_key_env": "GROQ_API_KEY"
    },
    "siliconflow": {
        "name": "SiliconFlow",
        "base_url": "https://api.siliconflow.cn/v1",
        "model": "Qwen/Qwen2.5-72B-Instruct",
        "description": "每天 14 元免费额度",
        "api_key_env": "SILICONFLOW_API_KEY"
    },
    "zhipu": {
        "name": "智谱 AI",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "glm-4-flash",
        "description": "25 元/天免费额度",
        "api_key_env": "ZHIPU_API_KEY"
    },
    "qwen": {
        "name": "通义千问",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-plus",
        "description": "阿里云，需要付费",
        "api_key_env": "LLM_API_KEY"
    }
}


def get_available_providers() -> List[Dict]:
    """获取可用的 AI 服务商列表（已配置 API Key 的）"""
    available = []
    for provider_id, config in AI_PROVIDERS.items():
        api_key = os.getenv(config["api_key_env"])
        if api_key:
            available.append({
                "id": provider_id,
                "name": config["name"],
                "description": config["description"],
                "model": config["model"]
            })
    return available


def get_llm_client(provider_id: str = None) -> OpenAI:
    """获取指定服务商的 LLM 客户端"""
    # 如果没有指定 provider，使用第一个可用的
    if provider_id is None:
        available = get_available_providers()
        if not available:
            raise ValueError("没有可用的 AI 服务商，请配置至少一个 API Key")
        provider_id = available[0]["id"]

    if provider_id not in AI_PROVIDERS:
        raise ValueError(f"未知的 AI 服务商: {provider_id}")

    config = AI_PROVIDERS[provider_id]
    api_key = os.getenv(config["api_key_env"])

    if not api_key:
        raise ValueError(f"请先配置 {config['name']} 的 API Key: {config['api_key_env']}")

    return OpenAI(api_key=api_key, base_url=config["base_url"]), config["model"]
