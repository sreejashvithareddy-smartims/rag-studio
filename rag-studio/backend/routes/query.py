from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import storage
from pipelines import get_pipeline, list_techniques

router = APIRouter(prefix="/api", tags=["query"])


class QueryRequest(BaseModel):
    doc_id: str
    technique: str
    query: str
    top_k: int = 5


@router.get("/techniques")
async def get_techniques():
    return list_techniques()


@router.post("/query")
async def run_query(req: QueryRequest):
    try:
        index = storage.load_index(req.doc_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Document '{req.doc_id}' not found.")

    try:
        pipeline = get_pipeline(req.technique, index)
        result = pipeline.run(req.query, top_k=req.top_k)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Pipeline error: {e}")

    return result
