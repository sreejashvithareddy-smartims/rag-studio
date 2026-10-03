from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import documents, query, compare, feedback, projects

app = FastAPI(title="RAG Studio API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(query.router)
app.include_router(compare.router)
app.include_router(feedback.router)
app.include_router(projects.router)


@app.on_event("startup")
async def warmup():
    try:
        from llm import embed_texts
        embed_texts(["warmup"])
        print("✓ Embedding model pre-loaded and ready.")
    except Exception as e:
        print(f"Warmup skipped: {e}")


@app.get("/api/health")
async def health():
    return {"status": "ok"}