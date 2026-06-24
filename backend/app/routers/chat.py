from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse
import httpx
import os

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        ai_engine_url = os.getenv("AI_ENGINE_URL", "https://arindamkatoch09-manipal-chatbot-ai.hf.space")
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                f"{ai_engine_url}/chat",
                json={"question": request.message}
            )
            data = res.json()
            return ChatResponse(
                response=data.get("answer", "No response"),
                sources=data.get("sources", [])
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
