import os
from fastapi import APIRouter, Depends, HTTPException
from azure.cosmos import CosmosClient
from ..routes.auth import get_current_user  # import auth dependency

router = APIRouter(prefix="/papers", tags=["papers"])

# Connect to Cosmos
client = CosmosClient(os.getenv("COSMOS_URL"), credential=os.getenv("COSMOS_KEY"))
database = client.get_database_client(os.getenv("COSMOS_DB"))
papers_container = database.get_container_client("papers")


# List only the current user's papers
@router.get("")
async def list_papers(user_email: str = Depends(get_current_user)):
    query = f"SELECT c.id, c.filename, c.uploaded_at FROM c WHERE c.user_email = '{user_email}'"
    items = list(papers_container.query_items(query, enable_cross_partition_query=True))
    return items


# Get one paper (ensures it belongs to the current user)
@router.get("/{paper_id}")
async def get_paper(paper_id: str, user_email: str = Depends(get_current_user)):
    query = f"SELECT * FROM c WHERE c.id = '{paper_id}' AND c.user_email = '{user_email}'"
    items = list(papers_container.query_items(query, enable_cross_partition_query=True))
    if not items:
        raise HTTPException(status_code=404, detail="Paper not found")
    return items[0]
