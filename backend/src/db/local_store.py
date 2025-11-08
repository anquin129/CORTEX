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


def list_papers() -> List[Dict[str, Any]]:
    return _papers.all()
