import time
from llm import chat

ANSWER_SYSTEM_PROMPT = (
    "You are a precise assistant answering questions using ONLY the provided context. "
    "If the answer isn't in the context, say you don't have enough information. "
    "Be concise and cite specific details from the context where relevant."
)


class BaseRAGPipeline:
    name = "base"
    label = "Base"
    description = "Base pipeline"

    def __init__(self, index: dict):
        self.index = index

    # --- to be implemented by subclasses ---
    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        """Returns list of {text, score, meta}"""
        raise NotImplementedError

    # --- shared generation step ---
    def generate(self, query: str, chunks: list[dict]) -> str:
        context = "\n\n---\n\n".join(f"[Chunk {i+1}]\n{c['text']}" for i, c in enumerate(chunks))
        prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer based only on the context above."
        return chat(prompt, system=ANSWER_SYSTEM_PROMPT, temperature=0.2, max_tokens=700)

    def run(self, query: str, top_k: int = 5) -> dict:
        t0 = time.time()
        chunks = self.retrieve(query, top_k=top_k)
        t_retrieve = time.time() - t0

        t1 = time.time()
        answer = self.generate(query, chunks)
        t_generate = time.time() - t1

        return {
            "technique": self.name,
            "label": self.label,
            "answer": answer,
            "chunks": chunks,
            "timing": {
                "retrieve_ms": round(t_retrieve * 1000, 1),
                "generate_ms": round(t_generate * 1000, 1),
                "total_ms": round((t_retrieve + t_generate) * 1000, 1),
            },
        }
