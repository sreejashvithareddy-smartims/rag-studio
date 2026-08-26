from pipelines.base import BaseRAGPipeline
from llm import embed_query
import vectorstore


class HierarchicalIndicesRAG(BaseRAGPipeline):
    name = "hierarchical_indices"
    label = "Hierarchical Indices"
    description = "Searches coarse section-level summaries first to find the right part of the document, then searches only the fine-grained chunks within that section."
    best_use_case = "Large documents where the answer's location varies widely — narrows the search space before doing detailed retrieval."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        q = embed_query(query)

        # Step 1: find the best-matching coarse section
        section_hits = vectorstore.query(doc_id, "coarse", q, top_k=1)
        if not section_hits:
            # fallback: no sections built (very short doc) -> plain fixed search
            hits = vectorstore.query(doc_id, "fixed", q, top_k=top_k)
            return [{"text": h["text"], "score": h["score"], "meta": {"chunk_index": h["chunk_index"]}} for h in hits]

        section_meta = self.index.get("sections", [])
        section_idx = section_hits[0]["chunk_index"]
        chunk_range = section_meta[section_idx] if section_idx < len(section_meta) else None

        # Step 2: search fine chunks, then filter to only those inside the chosen section's range
        fine_hits = vectorstore.query(doc_id, "fixed", q, top_k=max(top_k * 4, 15))
        if chunk_range:
            lo, hi = chunk_range
            fine_hits = [h for h in fine_hits if lo <= h["chunk_index"] < hi] or fine_hits

        top = fine_hits[:top_k]
        return [
            {
                "text": h["text"],
                "score": h["score"],
                "meta": {"chunk_index": h["chunk_index"], "section": section_idx, "section_preview": section_hits[0]["text"][:120]},
            }
            for h in top
        ]
