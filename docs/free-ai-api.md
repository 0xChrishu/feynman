# 免费 AI API 替代方案

## 推荐方案对比

| 服务商 | 模型 | 免费额度 | 推荐度 |
|--------|------|----------|--------|
| **DeepSeek** | DeepSeek-V3 | 500万 tokens/天 | ⭐⭐⭐⭐⭐ |
| **Groq** | Llama 3.3 | 完全免费 | ⭐⭐⭐⭐⭐ |
| **智谱 AI** | GLM-4 | 25元/天免费额度 | ⭐⭐⭐⭐ |
| **SiliconFlow** | 多模型 | 每天14元免费额度 | ⭐⭐⭐⭐ |

---

## 方案 1: DeepSeek（推荐）

### 为什么选择 DeepSeek？
- ✅ 完全免费，500万 tokens/天
- ✅ 性能接近 GPT-4
- ✅ OpenAI 兼容接口
- ✅ 国内访问快

### 获取 API Key

1. 访问 [platform.deepseek.com](https://platform.deepseek.com/)
2. 注册/登录
3. 进入 **API Keys** → **创建 API Key**

### 配置

```bash
# backend/.env
LLM_API_KEY=sk-你的deepseek密钥
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
```

---

## 方案 2: Groq（超快速度）

### 为什么选择 Groq？
- ✅ 完全免费，无限使用
- ✅ 速度极快（专有芯片）
- ✅ OpenAI 兼容接口
- ✅ 多个开源模型可选

### 获取 API Key

1. 访问 [console.groq.com](https://console.groq.com/)
2. 注册/登录
3. 创建 API Key

### 配置

```bash
# backend/.env
LLM_API_KEY=gsk_你的groq密钥
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

---

## 方案 3: SiliconFlow

### 为什么选择 SiliconFlow？
- ✅ 每天免费额度（约14元）
- ✅ 支持多个模型
- ✅ OpenAI 兼容

### 获取 API Key

1. 访问 [siliconflow.cn](https://siliconflow.cn/)
2. 注册/登录
3. 创建 API Key

### 配置

```bash
# backend/.env
LLM_API_KEY=sk-你的siliconflow密钥
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_MODEL=Qwen/Qwen2.5-72B-Instruct
```

---

## 方案 4: 智谱 AI

### 为什么选择智谱 AI？
- ✅ 25元/天免费额度
- ✅ 中文优化
- ✅ 稳定可靠

### 获取 API Key

1. 访问 [open.bigmodel.cn](https://open.bigmodel.cn/)
2. 注册/登录
3. 创建 API Key

### 配置

```bash
# backend/.env
LLM_API_KEY=你的智谱密钥
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-flash
```

---

## 快速切换配置

### 创建配置文件

创建 `backend/config/providers.py`：

```python
# AI 服务商配置
AI_PROVIDERS = {
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "model": "deepseek-chat",
        "description": "免费 500万 tokens/天"
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
        "description": "完全免费，速度最快"
    },
    "siliconflow": {
        "base_url": "https://api.siliconflow.cn/v1",
        "model": "Qwen/Qwen2.5-72B-Instruct",
        "description": "每天 14 元免费额度"
    },
    "zhipu": {
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "glm-4-flash",
        "description": "25 元/天免费额度"
    }
}

def get_provider_config(provider_name: str = "deepseek"):
    """获取指定服务商配置"""
    provider = os.getenv("AI_PROVIDER", provider_name)
    return AI_PROVIDERS.get(provider)
```

---

## 我的推荐

**如果你是测试/学习：**
→ 用 **DeepSeek**（500万 tokens/天，完全免费）

**如果你要追求速度：**
→ 用 **Groq**（速度最快，完全免费）

**如果你要长期使用：**
→ 多注册几个，备用切换

需要我帮你配置其中某个吗？
