from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from llm_providers import get_llm_client

router = APIRouter()


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


@router.post("/generate-question")
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


@router.post("/evaluate-answer")
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

        # Add the user's answer to the result
        result["transcription"] = user_answer

        return result
    except Exception as e:
        print(f"LLM Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers")
async def get_providers():
    """获取可用的 AI 模型服务商列表"""
    from llm_providers import get_available_providers
    return {"providers": get_available_providers()}
