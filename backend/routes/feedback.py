from fastapi import APIRouter
from pydantic import BaseModel
import feedback_store

router = APIRouter(prefix="/api", tags=["feedback"])


class FeedbackRequest(BaseModel):
    doc_id: str
    chunk_index: int
    vote: int  # +1 helpful, -1 unhelpful


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    feedback_store.record_vote(req.doc_id, req.chunk_index, req.vote)
    return {"status": "recorded"}
