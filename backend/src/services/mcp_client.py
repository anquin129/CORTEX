import os
import requests

MCP_URL = os.getenv("MCP_URL")
MCP_API_KEY = os.getenv("MCP_API_KEY")

def upload_to_mcp(file_path: str, paper_id: str):
    """Upload a file to the MCP server for ingestion.
    
    Args:
        file_path: Path to the file to upload
        paper_id: Unique identifier for the paper
        
    Returns:
        MCP document ID if successful
        
    Raises:
        ValueError: If MCP_URL is not set
        requests.RequestException: If the upload fails
    """
    if not MCP_URL:
        raise ValueError("MCP_URL environment variable is not set")
    
    headers = {}
    if MCP_API_KEY:
        headers["Authorization"] = f"Bearer {MCP_API_KEY}"
    
    # Use context manager to ensure file is closed
    with open(file_path, "rb") as f:
        files = {"file": f}
        response = requests.post(f"{MCP_URL}/ingest", headers=headers, files=files)
        response.raise_for_status()
        data = response.json()
        # expected to return something like {"mcp_document_id": "..."}
        return data.get("mcp_document_id")
