from pipelines.base import BaseRAGPipeline
from llm import embed_query, chat
import vectorstore

HYDE_PROMPT = """Write a short hypothetical passage (3-5 sentences) that would plausibly answer
the following question, as if it came directly from a reference document. Do not mention that
it's hypothetical.

Question: {query}"""


class HyDERAG(BaseRAGPipeline):
    name = "hyde"
    label = "HyDE"
    description = "Generates a hypothetical answer first, embeds THAT, and searches ChromaDB for chunks similar to it."
    best_use_case = "Questions worded very differently from how answers would naturally appear in the source document."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        doc_id = self.index["doc_id"]
        hypothetical = chat(HYDE_PROMPT.format(query=query), temperature=0.5, max_tokens=250)
        q = embed_query(hypothetical)
        hits = vectorstore.query(doc_id, "fixed", q, top_k=top_k)
        return [
            {"text": h["text"], "score": h["score"], "meta": {"chunk_index": h["chunk_index"], "hypothetical_doc": hypothetical}}
            for h in hits
        ]
