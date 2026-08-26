import numpy as np
from rank_bm25 import BM25Okapi
from pipelines.base import BaseRAGPipeline
from llm import embed_query, cosine_sim_matrix
import vectorstore


def _normalize(arr: np.ndarray) -> np.ndarray:
    if arr.max() == arr.min():
        return np.zeros_like(arr)
    return (arr - arr.min()) / (arr.max() - arr.min())


class FusionRAG(BaseRAGPipeline):
    name = "fusion"
    label = "Fusion"
    description = "Combines BM25 keyword search with ChromaDB vector similarity, blending both signals."
    best_use_case = "Queries containing exact terms, codes, or names where keyword matching should reinforce semantic search."

    def retrieve(self, query: str, top_k: int = 5, alpha: float = 0.5) -> list[dict]:
        chunks, embeddings = vectorstore.get_all(self.index["doc_id"], "fixed")
        if len(chunks) == 0:
            return []

        tokenized = [c.lower().split() for c in chunks]
        bm25 = BM25Okapi(tokenized)
        bm25_scores = np.array(bm25.get_scores(query.lower().split()))

        q = embed_query(query)
        vector_scores = cosine_sim_matrix(q, embeddings)

        combined = alpha * _normalize(vector_scores) + (1 - alpha) * _normalize(bm25_scores)
        top_idx = np.argsort(combined)[::-1][:top_k]

        return [
            {
                "text": chunks[i],
                "score": float(combined[i]),
                "meta": {"chunk_index": int(i), "vector_score": float(vector_scores[i]), "bm25_score": float(bm25_scores[i])},
            }
            for i in top_idx
        ]
