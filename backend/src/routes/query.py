from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import os, requests

router = APIRouter(prefix="/query", tags=["Query"])

MCP_URL = os.getenv("MCP_URL")
GEMINI_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

@router.get("")
def ask(question: str = Query(...)):
    # 1️⃣  Retrieve context from MCP
    try:
        mcp_resp = requests.post(f"{MCP_URL}/query_collection", json={"question": question})
        mcp_resp.raise_for_status()
        chunks = mcp_resp.json().get("chunks", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCP error: {e}")

    if not chunks:
        return JSONResponse({"answer": "Not found in the uploaded papers.", "citations": []})

    context = "\n\n".join(chunks)

    # 2️⃣  Call Gemini with context
    try:
        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}"
        payload = {
            "contents": [
                {"role": "user", "parts": [
                    {"text": f"Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer using only the context."}
                ]}
            ]
        }
        g_resp = requests.post(gemini_url, json=payload)
        g_resp.raise_for_status()
        data = g_resp.json()
        answer = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

    # 3️⃣  Return final result
    return JSONResponse({"answer": answer, "citations": chunks})
