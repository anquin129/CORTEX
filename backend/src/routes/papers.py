from fastapi import APIRouter
from ..db import local_store

router = APIRouter(prefix="/papers", tags=["papers"])

@router.get("")
async def list_papers():
    papers = local_store.list_papers()
    # Optionally filter out full paths if you only want safe public data
    simplified = [
        {
            "id": p["id"],
            "filename": p["filename"],
            "uploaded_at": p["uploaded_at"]
        }
        for p in papers
    ]
    return simplified
