import re
import numpy as np


def split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if s.strip()]


def fixed_size_chunks(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    """Character-based sliding window chunking with overlap."""
    text = re.sub(r"\s+", " ", text).strip()
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + chunk_size, n)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        start = end - overlap
    return chunks


def semantic_chunks_from_sentences(sentences: list[str], embeddings: np.ndarray,
                                    breakpoint_percentile: float = 90.0,
                                    max_sentences_per_chunk: int = 8) -> list[str]:
    """
    Groups consecutive sentences into chunks by splitting where cosine
    similarity between adjacent sentence embeddings drops sharply
    (i.e. topic shift). This mirrors the "semantic chunking" technique.
    """
    if len(sentences) <= 1:
        return sentences

    sims = []
    for i in range(len(embeddings) - 1):
        a, b = embeddings[i], embeddings[i + 1]
        sim = float(np.dot(a, b) / ((np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8))
        sims.append(sim)

    if not sims:
        return sentences

    threshold = np.percentile(sims, 100 - breakpoint_percentile)
    chunks, current = [], [sentences[0]]

    for i, sim in enumerate(sims):
        current.append(sentences[i + 1])
        is_breakpoint = sim < threshold
        if (is_breakpoint or len(current) >= max_sentences_per_chunk) and len(current) > 1:
            chunks.append(" ".join(current))
            current = []
    if current:
        chunks.append(" ".join(current))

    return [c for c in chunks if c.strip()]
