from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import json
import os
from ..multi_tool_agent.agent import CortexAgent

router = APIRouter(prefix="/reasoning", tags=["Reasoning"])

# Initialize agent (will be reused)
_agent = None

def get_agent():
    global _agent
    if _agent is None:
        _agent = CortexAgent()
    return _agent

@router.get("")
async def stream_reasoning(
    question: str = Query(...),
    collection_id: int = Query(default=1)
):
    """Stream reasoning steps in real-time as the agent processes the question."""
    
    agent = get_agent()
    
    def generate():
        try:
            for step_data in agent.chat_stream_reasoning(
                collection_id=collection_id,
                question=question
            ):
                # Format as Server-Sent Events
                data = json.dumps(step_data)
                yield f"data: {data}\n\n"
        except Exception as e:
            error_data = json.dumps({"step": f"Error: {str(e)}", "time_spent": 0, "error": True})
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

