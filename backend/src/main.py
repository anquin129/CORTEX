import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CORTEX", version="0.1.0")

# CORS (you can restrict origins later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Import routers ---
from .routes import auth
from .routes.upload import router as upload_router
from .routes.papers import router as papers_router
from .routes.chat import router as chat_router

# --- Register routers ---
app.include_router(auth.router)
app.include_router(upload_router)
app.include_router(papers_router)
app.include_router(chat_router)

# --- Health check ---
@app.get("/health")
async def health():
    return {"ok": True}
