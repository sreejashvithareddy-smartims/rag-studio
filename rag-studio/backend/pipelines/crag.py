from pipelines.base import BaseRAGPipeline
from llm import embed_query, chat
import vectorstore

GRADE_PROMPT = """On a scale of 0-10, how well does this retrieved context answer the question?
Respond with ONLY the number.

Question: {query}

Context: {context}"""

REWRITE_PROMPT = """The following search query returned weak results from a document search.
Rewrite it to be more likely to retrieve relevant passages. Return ONLY the rewritten query.

Original query: {query}"""


class CRAG(BaseRAGPipeline):
    name = "crag"
    label = "Corrective RAG (CRAG)"
    description = "Grades ChromaDB retrieval quality; if weak, rewrites the query and retrieves again before answering."
    best_use_case = "Situations where the first retrieval attempt may miss due to query phrasing, and a self-correction pass adds real value."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]

        def _retrieve(q_text):
            q = embed_query(q_text)
            return vectorstore.query(doc_id, "fixed", q, top_k=top_k)

        hits = _retrieve(query)
        if not hits:
            return []
        context_preview = "\n".join(h["text"][:300] for h in hits)

        try:
            grade_resp = chat(GRADE_PROMPT.format(query=query, context=context_preview), temperature=0.0, max_tokens=10)
            grade = float("".join(c for c in grade_resp if c.isdigit() or c == "."))
        except Exception:
            grade = 10.0

        corrected = False
        if grade < 5:
            rewritten = chat(REWRITE_PROMPT.format(query=query), temperature=0.3, max_tokens=60)
            new_hits = _retrieve(rewritten)
            if new_hits:
                hits = new_hits
                corrected = True

        return [
            {"text": h["text"], "score": h["score"], "meta": {"chunk_index": h["chunk_index"], "initial_grade": grade, "corrected": corrected}}
            for h in hits
        ]
