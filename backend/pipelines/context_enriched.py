from pipelines.base import BaseRAGPipeline
from llm import embed_query
import vectorstore


class ContextEnrichedRAG(BaseRAGPipeline):
    name = "context_enriched"
    label = "Context-Enriched RAG"
    description = "Retrieves top chunks (via ChromaDB) plus their immediate neighbors for surrounding context."
    best_use_case = "Narrative or procedural text where a chunk references 'the above/below' and needs its neighbors to make sense."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        # need the full ordered chunk list to fetch neighbors by index
        all_chunks, _ = vectorstore.get_all(doc_id, "fixed")
        if not all_chunks:
            return []

        n_anchors = max(1, top_k // 2)
        q = embed_query(query)
        anchors = vectorstore.query(doc_id, "fixed", q, top_k=n_anchors)

        seen = set()
        results = []
        for hit in anchors:
            i = hit["chunk_index"]
            for j in (i - 1, i, i + 1):
                if 0 <= j < len(all_chunks) and j not in seen:
                    seen.add(j)
                    tag = "anchor" if j == i else "neighbor"
                    results.append({"text": all_chunks[j], "score": hit["score"], "meta": {"chunk_index": j, "role": tag}})
            if len(results) >= top_k:
                break
        return results[:max(top_k, n_anchors)]
