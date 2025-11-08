import uuid
import logging
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..db import cosmos_store as local_store

logger = logging.getLogger(__name__)

# Accepts a PDF file from the user
# Saves it to your local uploads/ folder
# Records a small metadata entry in TinyDB
# Returns a confirmation JSON


router = APIRouter(prefix="/upload", tags=["upload"])

# Make sure uploads/ exists
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("")
async def upload_paper(file: UploadFile = File(...)):
    # 1. Check file type
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(status_code=415, detail="Only PDF files are supported.")

    # 2. Generate unique ID and save path
    paper_id = str(uuid.uuid4())
    stored_filename = f"{paper_id}.pdf"
    stored_path = UPLOADS_DIR / stored_filename

    # 3. Write file to disk
    try:
        content = await file.read()
        stored_path.write_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save failed: {e}")

    # 4. Upload to MCP server
    from ..services.mcp_client import upload_to_mcp
    mcp_id = None
    try:
        mcp_id = upload_to_mcp(str(stored_path), paper_id)
    except Exception as e:
        # Log error but continue - file is saved locally even if MCP upload fails
        logger.error(f"MCP upload failed: {e}")

    # 5. Create metadata record
    record = {
        "id": paper_id,
        "filename": file.filename,
        "stored_path": str(stored_path),
        "uploaded_at": datetime.utcnow().isoformat(),
    }
    if mcp_id:
        record["mcp_document_id"] = mcp_id

    # 6. Add record to TinyDB
    local_store.save_doc(
        user_id="default_user",
        filename=record["filename"],
        text=record.get("extracted_text", "")
    )

    # 7. Return confirmation
    return {
        "paper_id": paper_id,
        "filename": file.filename,
        "status": "uploaded"
    }
