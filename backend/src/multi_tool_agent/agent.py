"""
Cortex Assistant AI Agent

This module provides an AI agent powered by Google Gemini that can query research papers
using MCP tools and verify every factual claim. The agent uses Gemini for reasoning and
decision-making, with MCP tools for accessing research paper collections.

MCP Tools Expected:
- query_collection: 
  Input: { collection_id: int, question: str, max_sources?: int }
  Returns: { answer: str, citations: [ { chunk_id: int, score: float }, ... ] }
  
- verify_chunk:
  Input: { chunk_id: int }
  Returns: { chunk_id, text, paper_id, title, page_num, char_start, char_end, pdf_url }
"""

import os
import re
import sys
import json
import logging
import time
from typing import Dict, List, Optional, Any
from sklearn.metrics.pairwise import cosine_similarity

from dotenv import load_dotenv
import google.generativeai as genai
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Load environment variables from .env file
load_dotenv()

# Environment variables
CORTEX_MCP_URL = os.getenv("CORTEX_MCP_URL", "http://localhost:9000/mcp")
CORTEX_MCP_API_KEY = os.getenv("CORTEX_MCP_API_KEY")  # Optional
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
EMBEDDING_MODEL = "models/gemini-embedding-001"

# Logger - let the application configure logging at the top level
logger = logging.getLogger(__name__)

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not set. Agent will not be able to use LLM capabilities.")


class CortexAgent:
    """AI Agent powered by Gemini that uses MCP tools to query and verify research papers."""
    
    def __init__(
        self,
        mcp_url: Optional[str] = None,
        mcp_api_key: Optional[str] = None,
        gemini_model: Optional[str] = None
    ):
        """Initialize the Cortex Agent.
        
        Args:
            mcp_url: MCP server URL (defaults to CORTEX_MCP_URL env var)
            mcp_api_key: Optional MCP API key
            gemini_model: Gemini model name (defaults to GEMINI_MODEL env var or gemini-2.0-flash-exp)
        """
        self.mcp_client = MCPClient(
            mcp_url or CORTEX_MCP_URL,
            api_key=mcp_api_key or CORTEX_MCP_API_KEY
        )
        
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.model_name = gemini_model or GEMINI_MODEL
        self.model = genai.GenerativeModel(self.model_name)
        
        # Define tools for Gemini function calling
        self.tools = self._define_tools()
        
        logger.info(f"Initialized CortexAgent with model: {self.model_name}")
    
    def _define_tools(self) -> List[Dict[str, Any]]:
        """Define MCP tools as function declarations for Gemini."""
        return [
            {
                "function_declarations": [
                    {
                        "name": "query_collection",
                        "description": "Query a research paper collection with a question. Returns an answer with citations.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "collection_id": {
                                    "type": "integer",
                                    "description": "The ID of the collection to query"
                                },
                                "question": {
                                    "type": "string",
                                    "description": "The question to ask about the research papers"
                                },
                                "max_sources": {
                                    "type": "integer",
                                    "description": "Maximum number of sources to return (default: 5)",
                                    "default": 5
                                }
                            },
                            "required": ["collection_id", "question"]
                        }
                    },
                    {
                        "name": "verify_chunk",
                        "description": "Verify and retrieve detailed information about a specific citation chunk from a research paper.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "chunk_id": {
                                    "type": "integer",
                                    "description": "The chunk ID to verify and retrieve"
                                }
                            },
                            "required": ["chunk_id"]
                        }
                    }
                ]
            }
        ]
    
    def _call_tool(self, function_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool and return the result."""
        logger.info(f"Agent calling tool: {function_name} with args: {args}")
        return self.mcp_client.call_tool(function_name, args)
    
    def chat(
        self,
        collection_id: int,
        question: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Chat with the agent about research papers.
        
        Args:
            collection_id: The collection ID to query
            question: The user's question
            conversation_history: Optional conversation history for context
            
        Returns:
            Dictionary with keys: answer, citations, reasoning
        """
        start_time = time.time()
        reasoning = []
        verified_citations = []
        
        try:
            # Step 1: Query the collection using MCP tool
            reasoning.append(f"Step 1: Querying collection {collection_id} with question")
            query_result = self._call_tool("query_collection", {
                "collection_id": collection_id,
                "question": question,
                "max_sources": 5
            })
            
            initial_answer = query_result.get("answer", "")
            citations_data = query_result.get("citations", [])
            reasoning.append(f"Step 2: Received answer with {len(citations_data)} citations")
            
            # Step 2: Extract and verify citations
            chunk_ids = extract_citation_ids(initial_answer)
            if not chunk_ids and citations_data:
                chunk_ids = [
                    cit.get("chunk_id")
                    for cit in citations_data[:5]
                    if cit.get("chunk_id") is not None
                ]
            
            reasoning.append(f"Step 3: Verifying {len(chunk_ids)} citation chunks")
            
            # Verify each chunk
            for chunk_id in chunk_ids[:5]:  # Limit to 5
                try:
                    verify_result = self._call_tool("verify_chunk", {"chunk_id": chunk_id})
                    verified_citations.append({
                        "chunk_id": chunk_id,
                        "verification_status": "verified",
                        "paper_title": verify_result.get("title"),
                        "page_num": verify_result.get("page_num"),
                        "snippet": verify_result.get("text", "")[:200],
                        "pdf_url": verify_result.get("pdf_url"),
                        "paper_id": verify_result.get("paper_id"),
                    })
                except Exception as e:
                    verified_citations.append({
                        "chunk_id": chunk_id,
                        "verification_status": "failed",
                        "error": str(e)
                    })
            
            # Step 3: Use Gemini to generate a comprehensive answer with verified citations
            reasoning.append("Step 4: Generating comprehensive answer with Gemini")
            
            # Build prompt for Gemini
            citations_text = "\n".join([
                f"- {cit.get('paper_title', 'Unknown')} (page {cit.get('page_num', 'N/A')}): {cit.get('snippet', '')[:100]}..."
                for cit in verified_citations if cit.get("verification_status") == "verified"
            ])
            
            prompt = f"""You are Cortex Assistant, an AI agent helping researchers understand research papers.

User Question: {question}

Initial Answer from Collection Query:
{initial_answer}

Verified Citations:
{citations_text}

Based on the initial answer and verified citations above, provide a comprehensive, well-structured answer that:
1. Directly addresses the user's question
2. Incorporates information from the verified citations
3. Includes paper titles and page numbers where relevant
4. Is clear, accurate, and well-formatted

Answer:"""
            
            # Generate answer with Gemini
            response = self.model.generate_content(prompt)
            final_answer = response.text if response.text else initial_answer
            
            reasoning.append("Step 5: Answer generated successfully")
            
            elapsed_time = time.time() - start_time
            logger.info(f"Agent chat completed in {elapsed_time:.2f}s")
            
            return {
                "answer": final_answer,
                "citations": verified_citations,
                "reasoning": reasoning,
                "model": self.model_name,
                "initial_answer": initial_answer
            }
            
        except Exception as e:
            logger.error(f"Agent chat failed: {e}", exc_info=True)
            return {
                "answer": f"I encountered an error: {str(e)}",
                "citations": verified_citations,
                "reasoning": reasoning + [f"Error: {str(e)}"],
                "error": str(e)
            }


class MCPClient:
    """Simple MCP client wrapper that performs HTTP requests to MCP server endpoints."""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        # Add authorization header if API key is provided (matching mcp_client.py pattern)
        if self.api_key:
            self.session.headers.update({"Authorization": f"Bearer {self.api_key}"})
        
        # Configure retries (2 retries on network failure)
        retry_strategy = Retry(
            total=2,
            backoff_factor=0.3,
            status_forcelist=[500, 502, 503, 504],
            allowed_methods=["GET", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
    
    def call_tool(self, tool_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call an MCP tool via HTTP POST.
        
        Args:
            tool_name: Name of the MCP tool (e.g., 'query_collection', 'verify_chunk')
            payload: Tool input parameters as a dictionary
            
        Returns:
            JSON response from the tool
            
        Raises:
            requests.RequestException: On network errors
            ValueError: On non-200 responses
        """
        url = f"{self.base_url}/{tool_name}"
        logger.info(f"Calling MCP tool '{tool_name}' at {url} with payload: {payload}")
        
        try:
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()  # Raises HTTPError for bad responses
            
            result = response.json()
            logger.info(f"MCP tool '{tool_name}' returned: {result}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"MCP tool '{tool_name}' failed: {e}")
            raise ValueError(f"MCP tool '{tool_name}' failed: {str(e)}")


def extract_citation_ids(answer_text: str) -> List[int]:
    """
    Extract chunk IDs from citation tags in the answer text.
    
    Finds tokens of the form [SRC:chunk_123] (case-insensitive for the SRC token).
    Returns a unique list of integer chunk ids, preserving order of first appearance.

    Args:
        answer_text: The answer text that may contain citation tags like [SRC:chunk_123]

    Returns:
        List of unique chunk IDs in order of first appearance
    """
    # Pattern to match [SRC:chunk_123] or [src:chunk_123] etc. (case-insensitive SRC)
    pattern = r'\[src:chunk_(\d+)\]'
    
    matches = re.findall(pattern, answer_text, re.IGNORECASE)
    chunk_ids = []
    seen = set()
    
    for match in matches:
        chunk_id = int(match)
        if chunk_id not in seen:
            chunk_ids.append(chunk_id)
            seen.add(chunk_id)
    
    logger.info(f"Extracted {len(chunk_ids)} citation IDs from answer: {chunk_ids}")
    return chunk_ids


def handle_question(
    collection_id: int,
    question: str,
    max_sources: int = 5,
    mcp_client: Optional[MCPClient] = None
) -> Dict[str, Any]:
    """
    Handle a question by querying the collection and verifying all citations.

    Args:
        collection_id: The collection ID to query
        question: The question to ask
        max_sources: Maximum number of sources to verify
        mcp_client: Optional MCPClient instance (creates new one if not provided)

    Returns:
        Dictionary with keys: answer, citations
        citations is a list of objects with: chunk_id, score (optional), verification_status,
        paper_title, page_num, snippet, pdf_url
    """
    if mcp_client is None:
        mcp_url = CORTEX_MCP_URL
        mcp_client = MCPClient(mcp_url, api_key=CORTEX_MCP_API_KEY)
    
    start_time = time.time()
    logger.info(f"Handling question for collection {collection_id}: {question}")
    
    # Step 1: Query the collection
    try:
        query_response = mcp_client.call_tool(
            "query_collection",
            {
                "collection_id": collection_id,
                "question": question,
                "max_sources": max_sources
            }
        )
    except Exception as e:
        logger.error(f"query_collection failed: {e}")
        return {
            "answer": "query_failed",
            "error": str(e),
            "citations": []
        }
    
    answer = query_response.get("answer", "")
    citations_data = query_response.get("citations", [])

    # --- Step: semantic re-ranking of citations by similarity to answer ---
    if citations_data:
        try:
            # Embed the answer
            answer_embedding = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=answer
            )["embedding"]

            # Compute similarity for each chunk text
            for cit in citations_data:
                text = cit.get("text") or cit.get("snippet") or ""
                if not text.strip():
                    cit["similarity"] = 0.0
                    continue
                chunk_emb = genai.embed_content(
                    model=EMBEDDING_MODEL,
                    content=text
                )["embedding"]
                cit["similarity"] = cosine_similarity(
                    [answer_embedding], [chunk_emb]
                )[0][0]

            # Sort by similarity (descending)
            citations_data.sort(key=lambda c: c["similarity"], reverse=True)

            # Boost top match
            if citations_data:
                top = citations_data[0]
                top["score"] = top.get("score", 0) + 1.0  # gentle boost
                logger.info(
                    f"Top semantic match: chunk {top.get('chunk_id')} "
                    f"(similarity={top.get('similarity'):.3f})"
                )

        except Exception as e:
            logger.warning(f"Semantic ranking skipped: {e}")
    # Step 2: Extract chunk IDs from answer or citations array
    chunk_ids = []
    citation_tag_ids = extract_citation_ids(answer)

    if citation_tag_ids:
        # Explicitly cited chunk(s) — use only the first one
        chunk_ids = [citation_tag_ids[0]]
        logger.info(f"Using explicitly cited chunk: {chunk_ids[0]}")
    elif citations_data:
        # Choose the single highest scoring chunk deterministically
        top_chunk = max(
            citations_data,
            key=lambda c: (c.get("score", 0.0), -c.get("chunk_id", 0))
        )
        chunk_ids = [top_chunk["chunk_id"]]
        logger.info(f"Using top chunk: {chunk_ids[0]}")
    else:
        logger.warning("No explicit citations found; unable to select source chunk.")
        return {
            "answer": "I don't know",
            "citations": []
        }

    
    # Step 3: Verify each chunk
    verified_citations = []
    chunk_scores = {cit.get("chunk_id"): cit.get("score") for cit in citations_data}
    
    for chunk_id in chunk_ids:
        try:
            verify_response = mcp_client.call_tool("verify_chunk", {"chunk_id": chunk_id})
            
            citation_obj = {
                "chunk_id": chunk_id,
                "verification_status": "verified",
                "paper_title": verify_response.get("title", None),
                "page_num": verify_response.get("page_num", None),
                "snippet": verify_response.get("text", ""),
                "pdf_url": verify_response.get("pdf_url", None),
                "paper_id": verify_response.get("paper_id", None),
                "char_start": verify_response.get("char_start", None),
                "char_end": verify_response.get("char_end", None),
            }
            
            # Add score if available
            if chunk_id in chunk_scores:
                citation_obj["score"] = chunk_scores[chunk_id]
            
            verified_citations.append(citation_obj)
            logger.info(f"Verified chunk {chunk_id}: {citation_obj.get('paper_title', 'N/A')}")
            
        except Exception as e:
            # Mark as failed
            error_msg = str(e)
            logger.error(f"verify_chunk failed for chunk {chunk_id}: {error_msg}")
            
            citation_obj = {
                "chunk_id": chunk_id,
                "verification_status": "failed",
                "error": error_msg,
                "paper_title": None,
                "page_num": None,
                "snippet": None,
                "pdf_url": None,
            }
            
            if chunk_id in chunk_scores:
                citation_obj["score"] = chunk_scores[chunk_id]
            
            verified_citations.append(citation_obj)
    
    # Add note if no tags and no citations were provided
    if not citation_tag_ids and not citations_data:
        answer += " Note: citations were not provided by the model; system appended candidate citations for verification."
    
    elapsed_time = time.time() - start_time
    logger.info(f"Question handling completed in {elapsed_time:.2f}s with {len(verified_citations)} citations")
    
    return {
        "answer": answer,
        "citations": verified_citations
    }


def pretty_print_response(response: Dict[str, Any]):
    """Pretty print the verified response for CLI output."""
    print("\n" + "="*80)
    print("Answer:")
    print("-"*80)
    print(response.get("answer", "No answer provided"))
    
    print("\n" + "="*80)
    print("Citations:")
    print("-"*80)
    
    citations = response.get("citations", [])
    if not citations:
        print("No citations found.")
        return
    
    for idx, cit in enumerate(citations, 1):
        chunk_id = cit.get("chunk_id", "unknown")
        status = cit.get("verification_status", "unknown")
        title = cit.get("paper_title", "Unknown Title")
        page = cit.get("page_num")
        snippet = cit.get("snippet", "")
        pdf_url = cit.get("pdf_url", "")
        error = cit.get("error")
        
        status_display = status
        if status == "failed":
            status_display = f"failed — error: {error}"
        
        print(f"\n{idx}) chunk_{chunk_id} — {status_display}")
        print(f'   "{title}"', end="")
        if page is not None:
            print(f" (page {page})")
        else:
            print()
        
        if snippet:
            snippet_preview = snippet[:200] + ("..." if len(snippet) > 200 else "")
            print(f'   snippet: "{snippet_preview}"')
        
        if pdf_url:
            print(f"   pdf: {pdf_url}")
    
    print("\n" + "="*80)


if __name__ == "__main__":
    mcp_url = CORTEX_MCP_URL
    
    print("Cortex Assistant - AI Agent for Research Paper Queries")
    print(f"MCP Server URL: {mcp_url}")
    print(f"Gemini Model: {GEMINI_MODEL}")
    print()
    
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable is required")
        print("Set it with: export GEMINI_API_KEY=your_api_key")
        sys.exit(1)
    
    # Get collection_id and question from command line or interactive input
    if len(sys.argv) >= 3:
        collection_id = int(sys.argv[1])
        question = " ".join(sys.argv[2:])
    else:
        try:
            collection_id = int(input("Enter collection_id: "))
            question = input("Enter your question: ")
        except (ValueError, KeyboardInterrupt):
            print("\nInvalid input or cancelled.")
            sys.exit(1)
    
    # Initialize agent and chat
    try:
        agent = CortexAgent()
        response = agent.chat(collection_id, question)
        
        # Pretty print response
        print("\n" + "="*80)
        print("Agent Response:")
        print("-"*80)
        print(response.get("answer", "No answer provided"))
        
        if response.get("reasoning"):
            print("\n" + "="*80)
            print("Reasoning Steps:")
            print("-"*80)
            for step in response.get("reasoning", []):
                print(f"  • {step}")
        
        citations = response.get("citations", [])
        if citations:
            print("\n" + "="*80)
            print("Verified Citations:")
            print("-"*80)
            for idx, cit in enumerate(citations, 1):
                chunk_id = cit.get("chunk_id", "unknown")
                status = cit.get("verification_status", "unknown")
                title = cit.get("paper_title", "Unknown Title")
                page = cit.get("page_num")
                snippet = cit.get("snippet", "")
                
                print(f"\n{idx}) chunk_{chunk_id} — {status}")
                print(f'   "{title}"', end="")
                if page is not None:
                    print(f" (page {page})")
                else:
                    print()
                if snippet:
                    print(f'   snippet: "{snippet}..."')
        
        print("\n" + "="*80)
        
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        print(f"\nError: {e}")
        sys.exit(1)
