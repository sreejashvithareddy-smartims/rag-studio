from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel
import storage
import history_store
from pipelines import get_pipeline
import evaluate

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
        result_a = await run_in_threadpool(pipeline_a.run, req.query, top_k=req.top_k)
        result_b = await run_in_threadpool(pipeline_b.run, req.query, top_k=req.top_k)
        comparison = await run_in_threadpool(evaluate.compare, req.query, result_a, result_b)
        chunk_overlap = evaluate.compute_chunk_overlap(result_a["chunks"], result_b["chunks"])
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Comparison error: {e}")

    response = {
        "query": req.query,
        "result_a": result_a,
        "result_b": result_b,
        "comparison": comparison,
        "chunk_overlap": chunk_overlap,
    }

    if req.project_id:
        history_store.log_event(req.project_id, {
            "type": "compare",
            "technique_a": result_a.get("label"),
            "technique_b": result_b.get("label"),
            "query": req.query,
            "doc_id": req.doc_id,
            "winner": comparison["verdict"].get("winner_label"),
            "similar_count": chunk_overlap["similar_count"],
            "different_count": chunk_overlap["different_count"],
            "comparison_data": response,
        })

    return response