import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers
from .routes.upload import router as upload_router
from .routes.papers import router as papers_router

# Load environment variables
load_dotenv()

# Initialize app
app = FastAPI(title="CORTEX", version="0.1.0")

# CORS setup — let frontend connect (adjust origins later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # during dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routes.query import router as query_router
app.include_router(query_router)


# Health check
@app.get("/health")
async def health():
    return {"ok": True}

# Register routes
app.include_router(upload_router)
app.include_router(papers_router)
