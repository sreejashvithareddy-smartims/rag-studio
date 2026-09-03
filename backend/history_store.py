import os
import json
import time
from config import settings

HISTORY_PATH = os.path.join(settings.DATA_DIR, "history.json")


def _load() -> dict:
    if os.path.exists(HISTORY_PATH):
        with open(HISTORY_PATH, "r") as f:
            return json.load(f)
    return {}


def _save(data: dict):
    with open(HISTORY_PATH, "w") as f:
        json.dump(data, f, indent=2)


def log_event(project_id: str, event: dict):
    """event example:
    {"type": "query", "technique": "hyde", "query": "...", "doc_id": "...", "answer_preview": "..."}
    {"type": "compare", "technique_a": "simple", "technique_b": "reranker", "query": "...", "winner": "..."}
    """
    data = _load()
    entries = data.setdefault(project_id, [])
    entries.insert(0, {**event, "timestamp": time.time()})
    data[project_id] = entries[:200]  # cap history length per project
    _save(data)


def get_history(project_id: str) -> list[dict]:
    return _load().get(project_id, [])