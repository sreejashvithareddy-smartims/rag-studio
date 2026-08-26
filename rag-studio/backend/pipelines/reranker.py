import re
from pipelines.base import BaseRAGPipeline
from llm import embed_query, chat
import vectorstore

RERANK_PROMPT = """Rate how relevant this passage is to the question on a scale of 0-10.
Respond with ONLY the number.

Question: {query}

Passage: {passage}"""


class RerankerRAG(BaseRAGPipeline):
    name = "reranker"
    label = "Reranker"
    description = "Retrieves a wide candidate pool from ChromaDB, then an LLM re-scores each for true relevance."
    best_use_case = "Ambiguous queries where vector similarity returns many loosely-related chunks that need careful filtering."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        q = embed_query(query)
        candidate_pool = max(top_k * 3, 10)
        candidates = vectorstore.query(doc_id, "fixed", q, top_k=candidate_pool)
        if not candidates:
            return []

        scored = []
        for hit in candidates:
            passage = hit["text"][:1200]
            try:
                resp = chat(RERANK_PROMPT.format(query=query, passage=passage), temperature=0.0, max_tokens=10)
                match = re.search(r"\d+(\.\d+)?", resp)
                llm_score = float(match.group()) if match else 0.0
            except Exception:
                llm_score = 0.0
            scored.append((hit, llm_score))

        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:top_k]
        return [
            {"text": hit["text"], "score": llm_score / 10.0, "meta": {"chunk_index": hit["chunk_index"], "vector_score": hit["score"]}}
            for hit, llm_score in top
        ]
