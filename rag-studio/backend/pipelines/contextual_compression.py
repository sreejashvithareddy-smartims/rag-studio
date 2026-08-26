from pipelines.base import BaseRAGPipeline
from llm import embed_query, chat
import vectorstore

COMPRESS_PROMPT = """Extract ONLY the sentences from this passage that are directly relevant to
the question below. Return the relevant sentences verbatim, nothing else. If nothing is relevant,
return "NONE".

Question: {query}

Passage: {passage}"""


class ContextualCompressionRAG(BaseRAGPipeline):
    name = "contextual_compression"
    label = "Contextual Compression"
    description = "Retrieves via ChromaDB, then an LLM strips each chunk down to only the query-relevant sentences."
    best_use_case = "Long chunks with lots of tangential content around one relevant sentence — cuts noise and token cost."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        q = embed_query(query)
        hits = vectorstore.query(doc_id, "fixed", q, top_k=top_k)
        if not hits:
            return []

        results = []
        for hit in hits:
            passage = hit["text"][:1200]
            try:
                compressed = chat(COMPRESS_PROMPT.format(query=query, passage=passage), temperature=0.0, max_tokens=300)
            except Exception:
                compressed = passage
            if compressed.strip().upper() == "NONE":
                continue
            results.append({
                "text": compressed.strip(),
                "score": hit["score"],
                "meta": {"chunk_index": hit["chunk_index"], "original_len": len(passage), "compressed_len": len(compressed)},
            })
        return results or [{"text": hits[0]["text"], "score": hits[0]["score"], "meta": {"chunk_index": hits[0]["chunk_index"]}}]
