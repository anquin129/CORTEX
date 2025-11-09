import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Initialize app once
app = FastAPI(title="CORTEX", version="0.1.0")

# CORS setup — let frontend connect (adjust origins later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # during dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
from .routes import auth
from .routes.upload import router as upload_router
from .routes.papers import router as papers_router
from .routes.query import router as query_router

# Register routers
app.include_router(auth.router)
app.include_router(upload_router)
app.include_router(papers_router)
app.include_router(query_router)

# Health check
@app.get("/health")
async def health():
    return {"ok": True}
