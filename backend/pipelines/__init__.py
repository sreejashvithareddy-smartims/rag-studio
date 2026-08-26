from pipelines.simple import SimpleRAG
from pipelines.semantic_chunking import SemanticChunkingRAG
from pipelines.context_enriched import ContextEnrichedRAG
from pipelines.contextual_chunk_headers import ContextualChunkHeadersRAG
from pipelines.document_augmentation import DocumentAugmentationRAG
from pipelines.query_transform import QueryTransformRAG
from pipelines.reranker import RerankerRAG
from pipelines.rse import RSERag
from pipelines.contextual_compression import ContextualCompressionRAG
from pipelines.feedback_loop import FeedbackLoopRAG
from pipelines.adaptive import AdaptiveRAG
from pipelines.self_rag import SelfRAG
from pipelines.knowledge_graph import KnowledgeGraphRAG
from pipelines.hierarchical_indices import HierarchicalIndicesRAG
from pipelines.hyde import HyDERAG
from pipelines.fusion import FusionRAG
from pipelines.multimodal import MultimodalRAG
from pipelines.crag import CRAG

# Order matches the reference article's numbering (1-18)
ORDERED = [
    SimpleRAG,
    SemanticChunkingRAG,
    ContextEnrichedRAG,
    ContextualChunkHeadersRAG,
    DocumentAugmentationRAG,
    QueryTransformRAG,
    RerankerRAG,
    RSERag,
    ContextualCompressionRAG,
    FeedbackLoopRAG,
    AdaptiveRAG,
    SelfRAG,
    KnowledgeGraphRAG,
    HierarchicalIndicesRAG,
    HyDERAG,
    FusionRAG,
    MultimodalRAG,
    CRAG,
]

REGISTRY = {cls.name: cls for cls in ORDERED}


def list_techniques() -> list[dict]:
    return [
        {
            "number": i + 1,
            "name": cls.name,
            "label": cls.label,
            "description": cls.description,
            "best_use_case": getattr(cls, "best_use_case", ""),
        }
        for i, cls in enumerate(ORDERED)
    ]


def get_pipeline(technique_name: str, index: dict):
    if technique_name not in REGISTRY:
        raise ValueError(f"Unknown technique '{technique_name}'. Available: {list(REGISTRY.keys())}")
    return REGISTRY[technique_name](index)
