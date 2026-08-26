from pipelines.base import BaseRAGPipeline
from pipelines.simple import SimpleRAG
from pipelines.query_transform import QueryTransformRAG
from pipelines.context_enriched import ContextEnrichedRAG
from pipelines.hyde import HyDERAG
from llm import chat

CLASSIFY_PROMPT = """Classify this question into exactly ONE category. Respond with only the
category word.

Categories:
- factual: asks for a specific fact, number, name, or definition
- analytical: asks to compare, analyze, explain reasoning, or summarize multiple points
- exploratory: broad/open-ended, asks "what about X" with unclear scope
- contextual: depends heavily on surrounding narrative or sequence of events

Question: {query}"""


class AdaptiveRAG(BaseRAGPipeline):
    name = "adaptive"
    label = "Adaptive RAG"
    description = "Classifies the query type first, then routes to the retrieval strategy best suited to it."
    best_use_case = "Applications with unpredictable, varied question types where one fixed strategy would underperform on some of them."

    def run(self, query: str, top_k: int = 5) -> dict:
        try:
            category = chat(CLASSIFY_PROMPT.format(query=query), temperature=0.0, max_tokens=10).strip().lower()
        except Exception:
            category = "factual"

        category = next((c for c in ["factual", "analytical", "exploratory", "contextual"] if c in category), "factual")

        routing = {
            "factual": SimpleRAG,
            "analytical": QueryTransformRAG,
            "exploratory": HyDERAG,
            "contextual": ContextEnrichedRAG,
        }
        chosen_cls = routing[category]
        sub_pipeline = chosen_cls(self.index)
        result = sub_pipeline.run(query, top_k=top_k)

        result["technique"] = self.name
        result["label"] = self.label
        result["meta"] = {"routed_category": category, "routed_to": chosen_cls.label}
        return result
