from pipelines.base import BaseRAGPipeline
from llm import embed_query
import vectorstore


class MultimodalRAG(BaseRAGPipeline):
    name = "multimodal"
    label = "Multi Model"
    description = ("Retrieves text chunks as usual, and flags which retrieved sections come from pages "
                   "containing embedded images/figures in the source PDF.")
    best_use_case = "Figure-heavy PDFs (reports, manuals) where knowing 'this section has a diagram' matters, even without full image understanding."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        q = embed_query(query)
        hits = vectorstore.query(doc_id, "fixed", q, top_k=top_k)
        image_pages = set(self.index.get("image_pages", []))
        chunk_page_map = self.index.get("chunk_page_map", {})

        results = []
        for h in hits:
            page = chunk_page_map.get(str(h["chunk_index"]))
            has_image = page in image_pages if page is not None else False
            results.append({
                "text": h["text"],
                "score": h["score"],
                "meta": {"chunk_index": h["chunk_index"], "page": page, "has_image": has_image},
            })
        return results
