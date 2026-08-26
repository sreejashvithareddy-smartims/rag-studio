from pipelines.base import BaseRAGPipeline
from llm import embed_query
import vectorstore


class ContextualChunkHeadersRAG(BaseRAGPipeline):
    name = "contextual_chunk_headers"
    label = "Contextual Chunk Headers"
    description = "Each chunk is prefixed with a short LLM-written header describing its content before embedding, giving retrieval extra signal."
    best_use_case = "Documents with dense, jargon-heavy sections where a chunk alone doesn't reveal what topic it belongs to."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        q = embed_query(query)
        hits = vectorstore.query(doc_id, "headers", q, top_k=top_k)
        return [
            {"text": h["text"], "score": h["score"], "meta": {"chunk_index": h["chunk_index"], "has_header": True}}
            for h in hits
        ]
