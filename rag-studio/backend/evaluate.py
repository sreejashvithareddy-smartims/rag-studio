import re
import json
from llm import chat

FAITHFULNESS_PROMPT = """Given the CONTEXT and the ANSWER below, rate from 0-10 how well the
answer is supported by the context (10 = fully grounded, 0 = fabricated / unsupported).
Respond with ONLY the number.

CONTEXT:
{context}

ANSWER:
{answer}"""

RELEVANCE_PROMPT = """Given the QUESTION and the ANSWER below, rate from 0-10 how directly and
completely the answer addresses the question. Respond with ONLY the number.

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

    return {"faithfulness": faithfulness, "relevance": relevance}


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
    scores_a = score_result(query, result_a)
    scores_b = score_result(query, result_b)
    verdict = judge(query, result_a, result_b)

    winner_label = None
    if verdict["winner"] == "A":
        winner_label = result_a["label"]
    elif verdict["winner"] == "B":
        winner_label = result_b["label"]

    return {
        "scores": {result_a["technique"]: scores_a, result_b["technique"]: scores_b},
        "verdict": {**verdict, "winner_label": winner_label},
    }
