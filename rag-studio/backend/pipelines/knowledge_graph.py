import numpy as np
from pipelines.base import BaseRAGPipeline
from llm import embed_query, cosine_sim_matrix
import vectorstore


class KnowledgeGraphRAG(BaseRAGPipeline):
    name = "knowledge_graph"
    label = "Knowledge Graph"
    description = "Builds an entity co-occurrence graph; retrieval boosts chunks connected to entities mentioned in the query."
    best_use_case = "Questions about relationships between named entities (people, orgs, products) rather than plain topical similarity."

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        chunks, embeddings = vectorstore.get_all(self.index["doc_id"], "fixed")
        graph = self.index["graph"]
        if len(chunks) == 0:
            return []

        q = embed_query(query)
        sims = cosine_sim_matrix(q, embeddings)

        query_words = set(w.strip(".,?!").lower() for w in query.split())
        matched_nodes = [n for n in graph.nodes if any(w.lower() in n.lower() for w in query_words if len(w) > 3)]

        graph_chunk_ids = set()
        for node in matched_nodes:
            graph_chunk_ids.update(graph.nodes[node].get("chunks", []))
            for neighbor in graph.neighbors(node):
                graph_chunk_ids.update(graph.nodes[neighbor].get("chunks", []))

        boosted = sims.copy()
        for idx in graph_chunk_ids:
            if idx < len(boosted):
                boosted[idx] += 0.15

        top_idx = np.argsort(boosted)[::-1][:top_k]
        return [
            {
                "text": chunks[i],
                "score": float(boosted[i]),
                "meta": {"chunk_index": int(i), "graph_boosted": int(i) in graph_chunk_ids, "matched_entities": matched_nodes},
            }
            for i in top_idx
        ]
