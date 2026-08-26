from pipelines.base import BaseRAGPipeline
from llm import embed_query
import vectorstore


class SimpleRAG(BaseRAGPipeline):
    name = "simple"
    label = "Simple RAG"
    description = "Baseline: fixed-size chunks, plain vector-DB similarity search (ChromaDB)."
    best_use_case = "Short, well-structured documents with simple factual questions — the fastest, cheapest technique."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        q = embed_query(query)
        hits = vectorstore.query(self.index["doc_id"], "fixed", q, top_k=top_k)
        return [{"text": h["text"], "score": h["score"], "meta": {"chunk_index": h["chunk_index"]}} for h in hits]
