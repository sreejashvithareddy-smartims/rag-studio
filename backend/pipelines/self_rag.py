from pipelines.base import BaseRAGPipeline, ANSWER_SYSTEM_PROMPT
from llm import embed_query, chat
import vectorstore
import time

NEEDS_RETRIEVAL_PROMPT = """Does answering this question require looking up specific information from a
document, or can it be answered from general knowledge alone? Respond with ONLY "RETRIEVE" or "DIRECT".

Question: {query}"""

CRITIQUE_PROMPT = """Does the ANSWER below make claims that are NOT supported by the CONTEXT?
Respond with ONLY "SUPPORTED" or "UNSUPPORTED".

CONTEXT:
{context}

ANSWER:
{answer}"""

RETRY_SYSTEM_PROMPT = (
    "You are a precise assistant. Your previous answer contained claims not supported by the context. "
    "Answer again using ONLY information explicitly present in the context. If the context doesn't "
    "contain the answer, say so directly."
)


class SelfRAG(BaseRAGPipeline):
    name = "self_rag"
    label = "Self RAG"
    description = "The model first decides whether retrieval is even needed, then critiques its own answer against the retrieved context and retries once if unsupported."
    best_use_case = "Mixed workloads with both document-specific questions and general questions, where blind retrieval on every query wastes calls."

    def run(self, query: str, top_k: int = 5) -> dict:
        t0 = time.time()
        doc_id = self.index["doc_id"]

        try:
            decision = chat(NEEDS_RETRIEVAL_PROMPT.format(query=query), temperature=0.0, max_tokens=5).strip().upper()
        except Exception:
            decision = "RETRIEVE"
        needs_retrieval = "RETRIEVE" in decision

        chunks = []
        if needs_retrieval:
            q = embed_query(query)
            hits = vectorstore.query(doc_id, "fixed", q, top_k=top_k)
            chunks = [{"text": h["text"], "score": h["score"], "meta": {"chunk_index": h["chunk_index"]}} for h in hits]

        t_retrieve = time.time() - t0
        t1 = time.time()

        answer = self.generate(query, chunks) if chunks else chat(query, system=ANSWER_SYSTEM_PROMPT, temperature=0.2, max_tokens=700)

        self_critique = "not_applicable"
        if chunks:
            context = "\n\n".join(c["text"] for c in chunks)
            try:
                verdict = chat(CRITIQUE_PROMPT.format(context=context, answer=answer), temperature=0.0, max_tokens=5).strip().upper()
            except Exception:
                verdict = "SUPPORTED"
            if "UNSUPPORTED" in verdict:
                self_critique = "unsupported_retried"
                answer = chat(
                    f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer again using only the context.",
                    system=RETRY_SYSTEM_PROMPT, temperature=0.0, max_tokens=700,
                )
            else:
                self_critique = "supported"

        t_generate = time.time() - t1

        return {
            "technique": self.name,
            "label": self.label,
            "answer": answer,
            "chunks": chunks,
            "meta": {"used_retrieval": needs_retrieval, "self_critique": self_critique},
            "timing": {
                "retrieve_ms": round(t_retrieve * 1000, 1),
                "generate_ms": round(t_generate * 1000, 1),
                "total_ms": round((t_retrieve + t_generate) * 1000, 1),
            },
        }
