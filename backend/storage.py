import os
import re
import json
import pickle
import uuid
import time
import numpy as np
import networkx as nx

from config import settings
from llm import embed_texts, chat
from utils.pdf_reader import extract_text, get_page_image_info
from utils.chunking import fixed_size_chunks, split_sentences, semantic_chunks_from_sentences
import vectorstore

DOCS_META_PATH = os.path.join(settings.DATA_DIR, "documents.json")

HEADER_PROMPT = "Write a very short (5-8 word) descriptive label for what this passage is about. Respond with ONLY the label.\n\nPassage: {chunk}"
QUESTION_PROMPT = "Write ONE question that this passage directly answers. Respond with ONLY the question.\n\nPassage: {chunk}"
SECTION_SUMMARY_PROMPT = "Summarize the main topic of this section in one sentence.\n\nSection:\n{text}"


def _load_docs_meta() -> dict:
    if os.path.exists(DOCS_META_PATH):
        with open(DOCS_META_PATH, "r") as f:
            return json.load(f)
    return {}


def _save_docs_meta(meta: dict):
    with open(DOCS_META_PATH, "w") as f:
        json.dump(meta, f, indent=2)


def list_documents() -> list[dict]:
    meta = _load_docs_meta()
    return sorted(meta.values(), key=lambda d: d["created_at"], reverse=True)


def get_index_path(doc_id: str) -> str:
    return os.path.join(settings.INDEX_DIR, f"{doc_id}.pkl")


def load_index(doc_id: str) -> dict:
    path = get_index_path(doc_id)
    if not os.path.exists(path):
        raise FileNotFoundError(f"No index found for document {doc_id}")
    with open(path, "rb") as f:
        index = pickle.load(f)
    index["doc_id"] = doc_id
    return index


CAPITALIZED_PHRASE = re.compile(r"\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,3})\b")
STOPWORDS_START = {"The", "This", "That", "These", "Those", "It", "In", "On", "For", "A", "An"}


def _extract_entities(text: str) -> list[str]:
    found = set()
    for m in CAPITALIZED_PHRASE.finditer(text):
        phrase = m.group(1).strip()
        first_word = phrase.split()[0]
        if first_word in STOPWORDS_START or len(phrase) < 3:
            continue
        found.add(phrase)
    return list(found)


def _safe_chat(prompt: str, max_tokens: int = 40, fallback: str = "") -> str:
    try:
        return chat(prompt, temperature=0.2, max_tokens=max_tokens).strip()
    except Exception:
        return fallback


def build_document_index(file_path: str, original_filename: str) -> dict:
    doc_id = str(uuid.uuid4())[:8]
    raw_text = extract_text(file_path)
    if not raw_text.strip():
        raise ValueError("No extractable text found in the uploaded file.")

    # ---------- 1. Fixed-size chunking (base layer used by most techniques) ----------
    fixed_chunks = fixed_size_chunks(raw_text, chunk_size=800, overlap=150)
    fixed_embeddings = embed_texts(fixed_chunks)
    vectorstore.add_chunks(doc_id, "fixed", fixed_chunks, fixed_embeddings)

    # ---------- 2. Semantic chunking ----------
    sentences = split_sentences(raw_text)[:1500]
    sentence_embeddings = embed_texts(sentences) if sentences else np.zeros((0, fixed_embeddings.shape[1]))
    semantic_chunk_list = semantic_chunks_from_sentences(sentences, sentence_embeddings)
    semantic_embeddings = embed_texts(semantic_chunk_list) if semantic_chunk_list else np.zeros((0, fixed_embeddings.shape[1]))
    vectorstore.add_chunks(doc_id, "semantic", semantic_chunk_list, semantic_embeddings)

    # ---------- 3. Contextual chunk headers ----------
    # cap how many chunks get an LLM-written header to keep indexing time reasonable
    header_cap = min(len(fixed_chunks), 40)
    header_texts = []
    for i, c in enumerate(fixed_chunks):
        if i < header_cap:
            header = _safe_chat(HEADER_PROMPT.format(chunk=c[:500]), max_tokens=20, fallback="Untitled section")
        else:
            header = "Section"
        header_texts.append(f"{header}: {c}")
    header_embeddings = embed_texts(header_texts)
    vectorstore.add_chunks(doc_id, "headers", header_texts, header_embeddings)

    # ---------- 4. Document augmentation (pre-generated questions per chunk) ----------
    question_cap = min(len(fixed_chunks), 40)
    questions = []
    for i, c in enumerate(fixed_chunks[:question_cap]):
        q = _safe_chat(QUESTION_PROMPT.format(chunk=c[:500]), max_tokens=30, fallback=f"What does this section say? {c[:40]}")
        questions.append(q)
    aug_chunks = fixed_chunks[:question_cap]
    if questions:
        question_embeddings = embed_texts(questions)
        vectorstore.add_chunks(doc_id, "augmented", aug_chunks, question_embeddings)

    # ---------- 5. Hierarchical indices (coarse sections -> fine chunks) ----------
    section_size = max(3, len(fixed_chunks) // 8) if fixed_chunks else 0
    sections = []
    section_summaries = []
    if section_size:
        for start in range(0, len(fixed_chunks), section_size):
            end = min(start + section_size, len(fixed_chunks))
            section_text = " ".join(fixed_chunks[start:end])[:2000]
            summary = _safe_chat(SECTION_SUMMARY_PROMPT.format(text=section_text), max_tokens=40, fallback=section_text[:150])
            sections.append((start, end))
            section_summaries.append(summary)
    if section_summaries:
        section_embeddings = embed_texts(section_summaries)
        vectorstore.add_chunks(doc_id, "coarse", section_summaries, section_embeddings)

    # ---------- 6. Multimodal metadata (page + image tracking, PDF only) ----------
    num_pages, image_pages = get_page_image_info(file_path)
    chunk_page_map = {}
    if fixed_chunks:
        for i in range(len(fixed_chunks)):
            approx_page = min(num_pages - 1, int(i / len(fixed_chunks) * num_pages)) if num_pages > 0 else 0
            chunk_page_map[str(i)] = approx_page

    # ---------- 7. Entity graph (Knowledge Graph technique) ----------
    graph = nx.Graph()
    chunk_entities = []
    for i, chunk in enumerate(fixed_chunks):
        entities = _extract_entities(chunk)
        chunk_entities.append(entities)
        for e in entities:
            if not graph.has_node(e):
                graph.add_node(e, chunks=[])
            graph.nodes[e]["chunks"].append(i)
        for a in range(len(entities)):
            for b in range(a + 1, len(entities)):
                if graph.has_edge(entities[a], entities[b]):
                    graph[entities[a]][entities[b]]["weight"] += 1
                else:
                    graph.add_edge(entities[a], entities[b], weight=1)

    index = {
        "doc_id": doc_id,
        "filename": original_filename,
        "raw_text": raw_text,
        "graph": graph,
        "chunk_entities": chunk_entities,
        "sections": sections,
        "image_pages": image_pages,
        "chunk_page_map": chunk_page_map,
        "num_pages": num_pages,
    }

    with open(get_index_path(doc_id), "wb") as f:
        pickle.dump(index, f)

    meta = _load_docs_meta()
    meta[doc_id] = {
        "doc_id": doc_id,
        "filename": original_filename,
        "created_at": time.time(),
        "num_fixed_chunks": len(fixed_chunks),
        "num_semantic_chunks": len(semantic_chunk_list),
        "num_entities": graph.number_of_nodes(),
        "num_sections": len(sections),
        "num_pages": num_pages,
        "images_detected": len(image_pages) > 0,
        "chars": len(raw_text),
        "vector_db": "chromadb",
    }
    _save_docs_meta(meta)

    return meta[doc_id]


def delete_document(doc_id: str):
    meta = _load_docs_meta()
    meta.pop(doc_id, None)
    _save_docs_meta(meta)
    path = get_index_path(doc_id)
    if os.path.exists(path):
        os.remove(path)
    vectorstore.delete_document_collections(doc_id)
