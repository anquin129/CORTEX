import uuid
import logging
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from azure.cosmos import CosmosClient
from ..routes.auth import get_current_user  # import auth dependency
import os
from fastapi.responses import FileResponse


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])

# ensure uploads directory exists
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# connect to Cosmos
client = CosmosClient(os.getenv("COSMOS_URL"), credential=os.getenv("COSMOS_KEY"))
database = client.get_database_client(os.getenv("COSMOS_DB"))
papers_container = database.get_container_client("papers")


@router.post("")
async def upload_paper(
    file: UploadFile = File(...),
    user_email: str = Depends(get_current_user)  # ← logged-in user
):
    # 1. verify type
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(status_code=415, detail="Only PDF files are supported.")

    # 2. save file locally (temporary)
    paper_id = str(uuid.uuid4())
    stored_filename = f"{paper_id}.pdf"
    stored_path = UPLOADS_DIR / stored_filename
    try:
        content = await file.read()
        stored_path.write_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save failed: {e}")

    # (Optional) upload to MCP service if you still need it
    try:
        from ..services.mcp_client import upload_to_mcp
        mcp_id = upload_to_mcp(str(stored_path), paper_id)
    except Exception as e:
        logger.error(f"MCP upload failed: {e}")
        mcp_id = None

    # 3. record in Cosmos
    paper_doc = {
        "id": paper_id,
        "filename": file.filename,
        "stored_path": str(stored_path),
        "uploaded_at": datetime.utcnow().isoformat(),
        "user_email": user_email,  # ← links to the logged-in user
    }
    if mcp_id:
        paper_doc["mcp_document_id"] = mcp_id

    papers_container.create_item(paper_doc)

    return {"paper_id": paper_id, "filename": file.filename, "status": "uploaded"}

@router.get("/{paper_id}")
async def get_paper_file(paper_id: str, user_email: str = Depends(get_current_user)):
    """Return the actual uploaded PDF file if it belongs to the user."""
    file_path = UPLOADS_DIR / f"{paper_id}.pdf"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # check ownership
    query = f"SELECT * FROM c WHERE c.id = '{paper_id}' AND c.user_email = '{user_email}'"
    items = list(papers_container.query_items(query, enable_cross_partition_query=True))
    if not items:
        raise HTTPException(status_code=403, detail="Not authorized for this file")

    return FileResponse(file_path, media_type="application/pdf")