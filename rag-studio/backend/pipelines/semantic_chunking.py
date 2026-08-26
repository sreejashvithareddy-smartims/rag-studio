from pipelines.base import BaseRAGPipeline
from llm import embed_query
import vectorstore


class SemanticChunkingRAG(BaseRAGPipeline):
    name = "semantic_chunking"
    label = "Semantic Chunking"
    description = "Chunks split at topic-shift boundaries, retrieved via ChromaDB vector search."
    best_use_case = "Documents with mixed topics per page, where fixed-size cuts would slice ideas apart mid-thought."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        q = embed_query(query)
        hits = vectorstore.query(self.index["doc_id"], "semantic", q, top_k=top_k)
        return [{"text": h["text"], "score": h["score"], "meta": {"chunk_index": h["chunk_index"]}} for h in hits]
