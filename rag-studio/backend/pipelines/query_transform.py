from pipelines.base import BaseRAGPipeline
from llm import embed_query, chat
import vectorstore

TRANSFORM_PROMPT = """Given the user question below, produce THREE alternative search queries to
improve document retrieval:
1. A rewritten, more specific version of the question.
2. A "step-back" broader/general version of the question.
3. One sub-question that decomposes a key part of the question.

Return exactly 3 lines, no numbering, no extra text.

Question: {query}"""


class QueryTransformRAG(BaseRAGPipeline):
    name = "query_transform"
    label = "Query Transformation"
    description = "Rewrites the query into rewrite / step-back / sub-question variants, merges ChromaDB results for each."
    best_use_case = "Questions phrased very differently from how the document words the same concept."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]

        raw = chat(TRANSFORM_PROMPT.format(query=query), temperature=0.3, max_tokens=200)
        variants = [line.strip("-• ").strip() for line in raw.split("\n") if line.strip()]
        variants = variants[:3] or [query]
        variants.append(query)

        # query a wider pool per variant, then merge/average scores by chunk_index
        pool_k = max(top_k, 8)
        scores_by_chunk = {}
        text_by_chunk = {}
        for v in variants:
            try:
                q = embed_query(v)
            except Exception:
                continue
            for hit in vectorstore.query(doc_id, "fixed", q, top_k=pool_k):
                idx = hit["chunk_index"]
                scores_by_chunk[idx] = scores_by_chunk.get(idx, 0.0) + hit["score"]
                text_by_chunk[idx] = hit["text"]

        ranked = sorted(scores_by_chunk.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
        return [
            {"text": text_by_chunk[idx], "score": score / len(variants), "meta": {"chunk_index": idx, "query_variants": variants}}
            for idx, score in ranked
        ]
