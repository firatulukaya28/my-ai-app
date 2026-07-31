#!/usr/bin/env python3
"""IX AI Backend — proxies chat requests to the LLM API with SSE streaming."""
import json
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from anthropic import Anthropic

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic()

MODEL = "claude_sonnet_4_6"


@app.post("/api/chat")
async def chat(request: Request):
    """Receive messages + system prompt, stream AI response as SSE."""
    body = await request.json()
    messages = body.get("messages", [])
    system_prompt = body.get("system", "")
    temperature = body.get("temperature", 0.3)

    # Convert messages to Anthropic format (strip system, keep user/assistant turns)
    anthropic_messages = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role in ("user", "assistant") and content:
            anthropic_messages.append({"role": role, "content": content})

    if not anthropic_messages:
        return {"error": "No messages provided"}, 400

    async def stream():
        try:
            with client.messages.stream(
                model=MODEL,
                system=system_prompt,
                messages=anthropic_messages,
                max_tokens=4096,
                temperature=temperature,
            ) as stream:
                for text in stream.text_stream:
                    chunk = json.dumps({"text": text})
                    yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            error = json.dumps({"error": str(e)})
            yield f"data: {error}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.get("/api/health")
async def health():
    return {"status": "ok", "model": MODEL}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
