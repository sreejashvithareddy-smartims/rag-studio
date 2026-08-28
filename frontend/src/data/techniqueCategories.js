// Maps each technique's backend `name` to a category for the two-tab UI.
// Chunking & Indexing = techniques that differ in HOW the document is split/prepared.
// Retrieval & Ranking = techniques that differ in HOW you search/filter/rank given chunks.

export const CATEGORIES = {
  chunking: {
    title: 'Chunking & Indexing Methods',
    subtitle: 'These differ in how the document itself is split and indexed before any question is asked.',
  },
  retrieval: {
    title: 'Retrieval & Ranking Methods',
    subtitle: 'These differ in how a question searches, filters, or re-ranks chunks at query time.',
  },
}

export const TECHNIQUE_CATEGORY = {
  simple: 'chunking',
  semantic_chunking: 'chunking',
  contextual_chunk_headers: 'chunking',
  document_augmentation: 'chunking',
  hierarchical_indices: 'chunking',
  knowledge_graph: 'chunking',
  multimodal: 'chunking',

  context_enriched: 'retrieval',
  query_transform: 'retrieval',
  reranker: 'retrieval',
  rse: 'retrieval',
  contextual_compression: 'retrieval',
  feedback_loop: 'retrieval',
  adaptive: 'retrieval',
  self_rag: 'retrieval',
  hyde: 'retrieval',
  fusion: 'retrieval',
  crag: 'retrieval',
}