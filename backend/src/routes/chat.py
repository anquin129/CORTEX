import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from azure.cosmos import CosmosClient
from ..routes.auth import get_current_user  # import our auth dependency

router = APIRouter(prefix="/chats", tags=["chats"])

# Connect to Cosmos
client = CosmosClient(os.getenv("COSMOS_URL"), credential=os.getenv("COSMOS_KEY"))
database = client.get_database_client(os.getenv("COSMOS_DB"))
chats_container = database.get_container_client("chats")


# 1️⃣ Create a new chat
@router.post("")
async def create_chat(user_email: str = Depends(get_current_user)):
    chat_doc = {
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "messages": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    chats_container.create_item(chat_doc)
    return {"chat_id": chat_doc["id"]}


# 2️⃣ Add a message to a chat
@router.post("/{chat_id}/message")
async def add_message(
    chat_id: str,
    role: str,
    text: str,
    user_email: str = Depends(get_current_user),
):
    query = f"SELECT * FROM c WHERE c.id='{chat_id}' AND c.user_email='{user_email}'"
    items = list(chats_container.query_items(query, enable_cross_partition_query=True))
    if not items:
        raise HTTPException(status_code=404, detail="Chat not found")

    chat = items[0]
    chat["messages"].append(
        {"role": role, "text": text, "timestamp": datetime.utcnow().isoformat()}
    )
    chats_container.upsert_item(chat)
    return {"status": "ok"}


# 3️⃣ List all chats for the user
@router.get("")
async def list_chats(user_email: str = Depends(get_current_user)):
    query = f"SELECT c.id, c.created_at FROM c WHERE c.user_email='{user_email}'"
    items = list(chats_container.query_items(query, enable_cross_partition_query=True))
    return items
