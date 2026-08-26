# RAG Studio

A local playground for testing and comparing all 18 RAG (Retrieval-Augmented
Generation) techniques from the reference article, against your own documents,
backed by a real vector database.

## The flow

**Step 1 — Select a Document.** Upload a PDF/TXT/MD file. RAG Studio extracts
the text and builds every index all 18 techniques need (ChromaDB vector
collections, an entity graph, hierarchical section summaries, per-page image
detection) in one pass.

**Step 2 — Run a Query.** Browse all 18 techniques as flip cards — tap a card
to see its definition and best use case on the back. Select one, ask a
question, and see the generated answer plus the exact retrieved chunks.

**Step 3 — Compare Methods.** Pick Method 1 and Method 2, ask one question,
and an LLM judge scores both answers on faithfulness/relevance and picks a
winner with reasoning.

## Vector database

Retrieval is backed by **ChromaDB** — a real, persistent, local vector
database (not just an in-memory array). Every document gets multiple
collections (`fixed`, `semantic`, `headers`, `augmented`, `coarse`), each
queried with proper vector similarity search. Data persists on disk under
`backend/data/chroma/` between restarts.

## All 18 techniques

| # | Technique | What it does |
|---|---|---|
| 1 | Simple RAG | Baseline fixed-size chunking + ChromaDB similarity search |
| 2 | Semantic Chunking | Splits chunks at topic-shift boundaries instead of fixed size |
| 3 | Context-Enriched Retrieval | Pulls in neighboring chunks around each match |
| 4 | Contextual Chunk Headers | Prepends an LLM-written header to each chunk before embedding |
| 5 | Document Augmentation | Pre-generates a question per chunk; matches queries against those questions |
| 6 | Query Transformation | Rewrites the query into rewrite / step-back / sub-question variants |
| 7 | Re-Ranker | Wide vector recall, then LLM re-scores each candidate for true relevance |
| 8 | RSE (Relevant Segment Extraction) | Finds the best *contiguous* run of chunks instead of disjoint top-k |
| 9 | Contextual Compression | Strips each retrieved chunk down to only the query-relevant sentences |
| 10 | Feedback Loop | Boosts chunks users previously marked helpful via thumbs up/down |
| 11 | Adaptive RAG | Classifies the query type, routes to whichever strategy fits best |
| 12 | Self RAG | Decides if retrieval is needed at all, then critiques its own answer |
| 13 | Knowledge Graph | Entity co-occurrence graph; boosts chunks connected to query entities |
| 14 | Hierarchical Indices | Searches coarse section summaries first, then fine chunks within that section |
| 15 | HyDE | Generates a hypothetical answer first, embeds that, retrieves against it |
| 16 | Fusion | Blends BM25 keyword search with vector similarity |
| 17 | Multi Model | Flags which retrieved chunks come from pages containing images/figures |
| 18 | CRAG (Corrective RAG) | Grades its own retrieval quality and rewrites the query if it's weak |

Plus a **Compare** view (LLM-as-judge) scoring faithfulness, relevance, and
declaring a winner with reasoning for any two techniques head-to-head.

## Project structure

```
rag-studio/
├── backend/                    FastAPI app
│   ├── main.py
│   ├── config.py                 .env-driven settings
│   ├── llm.py                      provider-agnostic chat + embeddings wrapper
│   ├── vectorstore.py               ChromaDB wrapper (the actual vector DB layer)
│   ├── storage.py                    document upload → builds every index
│   ├── feedback_store.py               thumbs up/down persistence
│   ├── evaluate.py                       LLM-judge comparison logic
│   ├── utils/                              chunking + PDF extraction helpers
│   ├── pipelines/                            one file per RAG technique (18 total)
│   └── routes/                                 documents / query / compare / feedback
└── frontend/                    React + Tailwind dashboard
    └── src/
        ├── context/               shared selected-document state
        ├── pages/                   Documents, Query (flip-card grid), Compare
        └── components/                Sidebar, TechniqueCard, AnswerCard, ChunkList, MetricBar
```

## Requirements

- Python 3.10+
- Node.js 18+
- **No paid API key required by default.**
  - **Local embeddings** via `sentence-transformers` (runs on your machine, free, no key)
  - **Google Gemini free tier** for generating answers (no card required — get a key at https://aistudio.google.com/apikey)
- Optional: switch to OpenAI, Anthropic, or Groq for generation — see `.env.example`

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1        # Windows PowerShell. Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

copy .env.example .env           # Mac/Linux: cp .env.example .env
# open .env and paste in your GEMINI_API_KEY (free — https://aistudio.google.com/apikey)
# no other keys are required by default — embeddings and the vector DB both run locally for free

uvicorn main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`. First upload takes a bit longer — it
downloads the local embedding model (~90MB) once and runs 18 techniques'
worth of index-building (several LLM calls for headers/questions/summaries),
then everything after that is instant.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Notes on indexing cost/speed

Building all 18 techniques' indexes on upload does more work than a minimal
RAG app: it generates short headers and questions for up to 40 chunks each,
and section summaries for hierarchical indexing. This means upload takes
longer (more LLM calls) but every technique is instantly ready afterward —
no per-technique rebuild at query time.

## Extending it

Add a 19th technique in two steps:
1. Create `backend/pipelines/your_technique.py` implementing `retrieve()` on `BaseRAGPipeline`
2. Register it in `backend/pipelines/__init__.py`'s `ORDERED` list

It automatically appears in the flip-card grid and both Compare dropdowns —
no other frontend changes needed.
