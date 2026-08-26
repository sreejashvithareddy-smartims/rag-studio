"""
Vector database layer backed by ChromaDB (local, embedded, persistent — no
server to run, no account, no cost).

Each document gets two collections: "<doc_id>_fixed" and "<doc_id>_semantic",
one per chunking strategy. This is the actual vector DB every similarity-based
pipeline queries against; it's also the single source of truth for embeddings
(nothing duplicated in the pickle index besides raw chunk text needed for
algorithms that scan the *whole* corpus, like RSE, Fusion, and Graph RAG).
"""
import os
import numpy as np
import chromadb
from chromadb.config import Settings as ChromaSettings
from config import settings

_client = None


def get_client():
    global _client
    if _client is None:
        chroma_path = os.path.join(settings.DATA_DIR, "chroma")
        os.makedirs(chroma_path, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=chroma_path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def _collection_name(doc_id: str, kind: str) -> str:
    return f"doc_{doc_id}_{kind}"


def create_collection(doc_id: str, kind: str):
    client = get_client()
    name = _collection_name(doc_id, kind)
    try:
        client.delete_collection(name)
    except Exception:
        pass
    return client.create_collection(name, metadata={"hnsw:space": "cosine"})


def delete_document_collections(doc_id: str):
    client = get_client()
    for kind in ("fixed", "semantic"):
        try:
            client.delete_collection(_collection_name(doc_id, kind))
        except Exception:
            pass


def add_chunks(doc_id: str, kind: str, chunks: list[str], embeddings: np.ndarray):
    """Embeds and persists a chunk set into its own Chroma collection."""
    if len(chunks) == 0:
        return
    collection = create_collection(doc_id, kind)
    ids = [f"{kind}_{i}" for i in range(len(chunks))]
    metadatas = [{"chunk_index": i} for i in range(len(chunks))]
    # Chroma batches internally, but very large docs benefit from explicit batching
    batch_size = 500
    for start in range(0, len(chunks), batch_size):
        end = start + batch_size
        collection.add(
            ids=ids[start:end],
            documents=chunks[start:end],
            embeddings=embeddings[start:end].tolist(),
            metadatas=metadatas[start:end],
        )


def query(doc_id: str, kind: str, query_embedding: np.ndarray, top_k: int = 5) -> list[dict]:
    """Vector similarity search against Chroma. Returns chunks sorted by relevance."""
    client = get_client()
    try:
        collection = client.get_collection(_collection_name(doc_id, kind))
    except Exception:
        return []

    n_results = min(top_k, collection.count())
    if n_results == 0:
        return []

    res = collection.query(query_embeddings=[query_embedding.tolist()], n_results=n_results)
    out = []
    for i in range(len(res["ids"][0])):
        distance = res["distances"][0][i]
        similarity = 1.0 - distance  # cosine space: distance = 1 - cosine_similarity
        out.append({
            "chunk_index": res["metadatas"][0][i]["chunk_index"],
            "text": res["documents"][0][i],
            "score": float(similarity),
        })
    return out


def get_all(doc_id: str, kind: str) -> tuple[list[str], np.ndarray]:
    """
    Fetches every chunk + embedding for a collection, sorted by chunk_index.
    Used by algorithms that need the full corpus at once (RSE window scanning,
    Fusion's BM25 blend, Graph RAG's boosting) rather than a simple top-k lookup.
    """
    client = get_client()
    try:
        collection = client.get_collection(_collection_name(doc_id, kind))
    except Exception:
        return [], np.zeros((0, 384), dtype=np.float32)

    res = collection.get(include=["embeddings", "documents", "metadatas"])
    if not res["ids"]:
        return [], np.zeros((0, 384), dtype=np.float32)

    order = sorted(range(len(res["ids"])), key=lambda i: res["metadatas"][i]["chunk_index"])
    chunks = [res["documents"][i] for i in order]
    embeddings = np.array([res["embeddings"][i] for i in order], dtype=np.float32)
    return chunks, embeddings
