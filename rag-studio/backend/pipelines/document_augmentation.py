from pipelines.base import BaseRAGPipeline
from llm import embed_query
import vectorstore


class DocumentAugmentationRAG(BaseRAGPipeline):
    name = "document_augmentation"
    label = "Document Augmentation"
    description = "At index time, synthetic questions are pre-generated for each chunk; retrieval matches the user's question against those questions instead of raw text."
    best_use_case = "FAQ-style or support documents where users phrase things as questions that may not lexically match the source text."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        q = embed_query(query)
        # "augmented" collection stores generated questions; metadata maps back to original chunk text
        hits = vectorstore.query(doc_id, "augmented", q, top_k=top_k)
        return [
            {"text": h["text"], "score": h["score"], "meta": {"chunk_index": h["chunk_index"], "matched_via": "generated_question"}}
            for h in hits
        ]
