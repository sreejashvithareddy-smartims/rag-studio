import re
import json
import logging
from llm import chat
import ragas_eval

logger = logging.getLogger(__name__)

FAITHFULNESS_PROMPT = """Given the CONTEXT and the ANSWER below, rate from 0-10 how well the
answer is supported by the context. Be strict: only give 9-10 if EVERY claim in the answer is
explicitly and directly stated in the context. Deduct points for any claim that requires
inference, generalization, or isn't literally present in the context text.
Respond with ONLY the number.

CONTEXT:
{context}

ANSWER:
{answer}"""

RELEVANCE_PROMPT = """Given the QUESTION and the ANSWER below, rate from 0-10 how directly and
completely the answer addresses the question. Be strict: deduct points if the answer is vague,
partially off-topic, misses part of the question, or is more general than the question asked.
A score of 10 should be rare and reserved for a fully complete, precisely on-target answer.
Respond with ONLY the number.

QUESTION: {query}

ANSWER: {answer}"""

JUDGE_PROMPT = """You are comparing two answers to the same question, each produced by a
different RAG retrieval technique. Decide which answer is better overall, considering accuracy,
groundedness in the provided context, completeness, and clarity.

QUESTION: {query}

--- Answer A ({label_a}) ---
{answer_a}

--- Answer B ({label_b}) ---
{answer_b}

Respond in strict JSON with this exact shape, no extra text:
{{"winner": "A" or "B" or "tie", "reasoning": "2-3 sentence explanation"}}"""


def _extract_number(text: str, default: float = 5.0) -> float:
    match = re.search(r"\d+(\.\d+)?", text)
    return float(match.group()) if match else default


def score_result(query: str, result: dict) -> dict:
    """Custom LLM-judge scoring — used as a fallback if RAGAS fails. Only covers
    faithfulness/relevance since context precision has no simple single-prompt equivalent."""
    context = "\n\n".join(c["text"] for c in result["chunks"])[:6000]
    answer = result["answer"]

    try:
        faith_resp = chat(FAITHFULNESS_PROMPT.format(context=context, answer=answer), temperature=0.0, max_tokens=10)
        faithfulness = _extract_number(faith_resp) / 10.0
    except Exception:
        faithfulness = None

    try:
        rel_resp = chat(RELEVANCE_PROMPT.format(query=query, answer=answer), temperature=0.0, max_tokens=10)
        relevance = _extract_number(rel_resp) / 10.0
    except Exception:
        relevance = None

    return {"faithfulness": faithfulness, "relevance": relevance, "context_precision": None}


def _score_with_fallback(query: str, result: dict) -> tuple[dict, str]:
    """Tries RAGAS first (full metric suite). Falls back to custom LLM-judge scoring if RAGAS fails."""
    try:
        contexts = [c["text"] for c in result["chunks"]]
        ragas_result = ragas_eval.ragas_score(query, result["answer"], contexts)
        has_any = any(v is not None for v in ragas_result.values())
        if has_any:
            return {
                "faithfulness": ragas_result["faithfulness"],
                "relevance": ragas_result["answer_relevancy"],
                "context_precision": ragas_result["context_precision"],
            }, "ragas"
    except Exception as e:
        logger.error(
            "RAGAS scoring failed for technique %s; using the custom LLM judge (%s: %s)",
            result.get("technique", "unknown"),
            type(e).__name__,
            ragas_eval._redact_secrets(str(e)),
        )

    return score_result(query, result), "custom_llm_judge"


def judge(query: str, result_a: dict, result_b: dict) -> dict:
    try:
        raw = chat(
            JUDGE_PROMPT.format(
                query=query,
                label_a=result_a["label"],
                answer_a=result_a["answer"],
                label_b=result_b["label"],
                answer_b=result_b["answer"],
            ),
            temperature=0.0,
            max_tokens=250,
        )
        cleaned = raw.strip().strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
        parsed = json.loads(cleaned)
        return {"winner": parsed.get("winner", "tie"), "reasoning": parsed.get("reasoning", "")}
    except Exception as e:
        return {"winner": "tie", "reasoning": f"Judge model could not be parsed reliably ({e})."}


def compare(query: str, result_a: dict, result_b: dict) -> dict:
    if result_a["technique"] == result_b["technique"]:
        raise ValueError("Choose two different techniques to compare.")

    scores_a, engine_a = _score_with_fallback(query, result_a)
    scores_b, engine_b = _score_with_fallback(query, result_b)
    verdict = judge(query, result_a, result_b)

    winner_label = None
    if verdict["winner"] == "A":
        winner_label = result_a["label"]
    elif verdict["winner"] == "B":
        winner_label = result_b["label"]

    return {
        "scores": {result_a["technique"]: scores_a, result_b["technique"]: scores_b},
        "verdict": {**verdict, "winner_label": winner_label},
        "eval_engine": {result_a["technique"]: engine_a, result_b["technique"]: engine_b},
    }


def _normalize(text: str) -> set[str]:
    text = re.sub(r"[^\w\s]", " ", text.lower())
    return set(w for w in text.split() if len(w) > 2)


def _jaccard(text_a: str, text_b: str) -> float:
    set_a, set_b = _normalize(text_a), _normalize(text_b)
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union else 0.0


def compute_chunk_overlap(chunks_a: list[dict], chunks_b: list[dict], threshold: float = 0.75) -> dict:
    """
    Compares retrieved chunks between two techniques by text similarity (not index —
    different chunking strategies produce different chunk boundaries, so exact index
    matching would be meaningless). Returns which chunks both methods agreed on
    ("similar") vs. which each method uniquely surfaced ("not similar").
    """
    matched_b = set()
    similar = []
    unique_a = []

    for ca in chunks_a:
        best_score, best_idx = 0.0, None
        for j, cb in enumerate(chunks_b):
            if j in matched_b:
                continue
            score = _jaccard(ca["text"], cb["text"])
            if score > best_score:
                best_score, best_idx = score, j

        if best_score >= threshold:
            similar.append({
                "text_a": ca["text"],
                "text_b": chunks_b[best_idx]["text"],
                "similarity": round(best_score, 2),
                "chunk_index_a": ca.get("meta", {}).get("chunk_index"),
                "chunk_index_b": chunks_b[best_idx].get("meta", {}).get("chunk_index"),
            })
            matched_b.add(best_idx)
        else:
            unique_a.append(ca)

    unique_b = [cb for j, cb in enumerate(chunks_b) if j not in matched_b]

    return {
        "similar": similar,
        "unique_a": unique_a,
        "unique_b": unique_b,
        "similar_count": len(similar),
        "different_count": len(unique_a) + len(unique_b),
    }