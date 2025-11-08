from tinydb import TinyDB, Query
from pathlib import Path
from typing import Optional, Dict, Any, List

_DB_PATH = Path(__file__).parent / "db.json"
_db = TinyDB(_DB_PATH)
_papers = _db.table("papers")


def add_paper(record: Dict[str, Any]) -> None:
    _papers.insert(record)


def get_paper(paper_id: str) -> Optional[Dict[str, Any]]:
    Paper = Query()
    res = _papers.search(Paper.id == paper_id)
    return res[0] if res else None

import fitz  # PyMuPDF for PDF text extraction

def search_local_chunks(question: str) -> list[str]:
    """Return text chunks from locally stored PDFs that match the query."""
    results = []
    question_words = question.lower().split()

    for record in _papers.all():
        stored_path = record.get("stored_path")
        if not stored_path:
            continue

        try:
            doc = fitz.open(stored_path)
            for page in doc:
                text = page.get_text("text")
                for paragraph in text.split("\n\n"):
                    if any(w in paragraph.lower() for w in question_words):
                        results.append(paragraph.strip())
            doc.close()
        except Exception as e:
            print(f"Error reading {stored_path}: {e}")

    return results[:5]  # limit to 5 relevant chunks

def list_papers() -> List[Dict[str, Any]]:
    return _papers.all()
