import numpy as np
from pipelines.base import BaseRAGPipeline
from llm import embed_query, cosine_sim_matrix
import vectorstore


class RSERag(BaseRAGPipeline):
    name = "rse"
    label = "Relevant Segment Extraction"
    description = "Finds the best contiguous run of chunks (by summed similarity) instead of disjoint top-k picks."
    best_use_case = "Long-form explanations where the answer spans several consecutive paragraphs rather than one isolated fact."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        chunks, embeddings = vectorstore.get_all(self.index["doc_id"], "fixed")
        n = len(chunks)
        if n == 0:
            return []
        q = embed_query(query)
        sims = cosine_sim_matrix(q, embeddings)

        threshold = np.percentile(sims, 60)
        adjusted = sims - threshold

        window = max(2, min(top_k, n))
        best_start, best_score = 0, -1e9
        for start in range(0, max(1, n - window + 1)):
            score = float(np.sum(adjusted[start:start + window]))
            if score > best_score:
                best_score = score
                best_start = start

        end = min(best_start + window, n)
        segment_idx = list(range(best_start, end))
        return [
            {"text": chunks[i], "score": float(sims[i]), "meta": {"chunk_index": int(i), "segment": True}}
            for i in segment_idx
        ]
