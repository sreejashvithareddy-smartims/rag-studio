import numpy as np
from pipelines.base import BaseRAGPipeline
from llm import embed_query
import vectorstore
import feedback_store


class FeedbackLoopRAG(BaseRAGPipeline):
    name = "feedback_loop"
    label = "Feedback Loop"
    description = "Retrieves via ChromaDB, then boosts chunks that users previously marked as helpful (via feedback votes) for this document."
    best_use_case = "Long-running deployments (support bots, internal wikis) where accumulated user feedback should steer future retrieval."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        pool_k = max(top_k * 2, 10)
        q = embed_query(query)
        hits = vectorstore.query(doc_id, "fixed", q, top_k=pool_k)
        if not hits:
            return []

        votes = feedback_store.get_scores(doc_id)
        for h in hits:
            boost = votes.get(h["chunk_index"], 0) * 0.05  # small nudge per net vote
            h["adjusted_score"] = h["score"] + boost

        hits.sort(key=lambda h: h["adjusted_score"], reverse=True)
        top = hits[:top_k]
        return [
            {
                "text": h["text"],
                "score": h["adjusted_score"],
                "meta": {"chunk_index": h["chunk_index"], "base_score": h["score"], "feedback_votes": votes.get(h["chunk_index"], 0)},
            }
            for h in top
        ]
