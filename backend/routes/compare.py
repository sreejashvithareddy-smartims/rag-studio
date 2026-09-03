from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import storage
from pipelines import get_pipeline
import evaluate
import history_store

router = APIRouter(prefix="/api", tags=["compare"])


class CompareRequest(BaseModel):
    doc_id: str
    technique_a: str
    technique_b: str
    query: str
    top_k: int = 5
    project_id: str | None = None


@router.post("/compare")
async def run_compare(req: CompareRequest):
    try:
        index = storage.load_index(req.doc_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Document '{req.doc_id}' not found.")

    try:
        pipeline_a = get_pipeline(req.technique_a, index)
        pipeline_b = get_pipeline(req.technique_b, index)
        result_a = pipeline_a.run(req.query, top_k=req.top_k)
        result_b = pipeline_b.run(req.query, top_k=req.top_k)
        comparison = evaluate.compare(req.query, result_a, result_b)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Comparison error: {e}")

        if req.project_id:
        history_store.log_event(req.project_id, {
            "type": "compare",
            "technique_a": result_a.get("label"),
            "technique_b": result_b.get("label"),
            "query": req.query,
            "doc_id": req.doc_id,
            "winner": comparison["verdict"].get("winner_label"),
        })

    return {
        "query": req.query,
        "result_a": result_a,
        "result_b": result_b,
        "comparison": comparison,
    }
