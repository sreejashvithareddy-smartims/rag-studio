export const BEST_COMBINATIONS = [
  {
    title: 'Balanced Default',
    techniqueA: 'simple',
    techniqueB: 'reranker',
    blurb: 'Fixed-size chunking paired with an LLM reranker — solid accuracy without heavy indexing cost.',
  },
  {
    title: 'Long-Document Explainer',
    techniqueA: 'hierarchical_indices',
    techniqueB: 'rse',
    blurb: 'Coarse section search narrows scope first, then RSE pulls a full contiguous answer from within it.',
  },
  {
    title: 'Entity-Heavy Documents',
    techniqueA: 'knowledge_graph',
    techniqueB: 'fusion',
    blurb: 'Graph-boosted chunk selection combined with keyword+vector fusion — strong for names, codes, relationships.',
  },
  {
    title: 'FAQ / Support Docs',
    techniqueA: 'document_augmentation',
    techniqueB: 'query_transform',
    blurb: 'Pre-generated questions plus query rewriting — best when users phrase things very differently from the source text.',
  },
  {
    title: 'Maximum Precision',
    techniqueA: 'contextual_chunk_headers',
    techniqueB: 'contextual_compression',
    blurb: 'Header-enriched chunks retrieved, then compressed down to only the sentences that matter — cleanest final context.',
  },
  {
    title: 'Self-Correcting Pipeline',
    techniqueA: 'semantic_chunking',
    techniqueB: 'crag',
    blurb: 'Topic-coherent chunks combined with a self-grading, self-correcting retrieval pass.',
  },
]