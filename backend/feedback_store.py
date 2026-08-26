"""Tiny JSON-backed feedback store: per-document, per-chunk helpful/unhelpful votes."""
import os
import json
from config import settings

FEEDBACK_PATH = os.path.join(settings.DATA_DIR, "feedback.json")


def _load() -> dict:
    if os.path.exists(FEEDBACK_PATH):
        with open(FEEDBACK_PATH, "r") as f:
            return json.load(f)
    return {}


def _save(data: dict):
    with open(FEEDBACK_PATH, "w") as f:
        json.dump(data, f, indent=2)


def record_vote(doc_id: str, chunk_index: int, vote: int):
    """vote: +1 helpful, -1 unhelpful"""
    data = _load()
    doc_key = data.setdefault(doc_id, {})
    doc_key[str(chunk_index)] = doc_key.get(str(chunk_index), 0) + vote
    _save(data)


def get_scores(doc_id: str) -> dict:
    """Returns {chunk_index_int: cumulative_score}"""
    data = _load().get(doc_id, {})
    return {int(k): v for k, v in data.items()}
