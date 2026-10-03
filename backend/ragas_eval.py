"""RAGAS evaluation for ad-hoc comparisons, which have no reference answer."""
import importlib
import re

from config import settings

_llm_cache = None
_embeddings_cache = None


def _get_ragas_llm():
    global _llm_cache
    if _llm_cache is not None:
        return _llm_cache

    provider = settings.LLM_PROVIDER.lower()

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is required for RAGAS evaluation when LLM_PROVIDER=openai")
        _llm_cache = ChatOpenAI(model=settings.OPENAI_CHAT_MODEL, api_key=settings.OPENAI_API_KEY, temperature=0)

    elif provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is required for RAGAS evaluation when LLM_PROVIDER=gemini")
        _llm_cache = ChatGoogleGenerativeAI(model=settings.GEMINI_CHAT_MODEL, google_api_key=settings.GEMINI_API_KEY, temperature=0)

    else:
        raise RuntimeError(f"RAGAS evaluation isn't wired up for LLM_PROVIDER='{provider}'. Use 'openai' or 'gemini'.")

    return _llm_cache


def _get_ragas_embeddings():
    global _embeddings_cache
    if _embeddings_cache is None:
        from langchain_huggingface import HuggingFaceEmbeddings
        _embeddings_cache = HuggingFaceEmbeddings(model_name=settings.LOCAL_EMBEDDING_MODEL)
    return _embeddings_cache


def _safe_float(value):
    try:
        f = float(value)
        return f if f == f else None  # NaN check
    except (TypeError, ValueError):
        return None


def _load_ragas_components():
    """Load optional RAGAS dependencies only when Compare requests evaluation."""
    from datasets import Dataset
    from ragas import evaluate as ragas_evaluate
    from ragas.metrics import answer_relevancy, faithfulness

    metrics_module = importlib.import_module("ragas.metrics")
    precision_type = getattr(metrics_module, "LLMContextPrecisionWithoutReference", None)
    if precision_type is not None:
        precision_metric = precision_type()
    else:
        precision_metric = getattr(metrics_module, "context_precision_without_reference", None)
        if precision_metric is None:
            raise RuntimeError(
                "Installed RAGAS does not provide Context Precision without reference data. "
                "Install the project's pinned ragas==0.2.10 dependency."
            )

    precision_name = getattr(precision_metric, "name", "")
    if not precision_name:
        precision_name = "llm_context_precision_without_reference"
    return Dataset, ragas_evaluate, [faithfulness, answer_relevancy, precision_metric], precision_name


def _redact_secrets(message: str) -> str:
    for secret in (
        settings.OPENAI_API_KEY,
        settings.GEMINI_API_KEY,
        settings.GROQ_API_KEY,
        settings.ANTHROPIC_API_KEY,
    ):
        if secret:
            message = message.replace(secret, "[REDACTED]")
    message = re.sub(
        r"(?i)(api[_-]?key|token|password|secret)(\s*[:=]\s*)[^\s&,]+",
        r"\1\2[REDACTED]",
        message,
    )
    return message


def ragas_score(query: str, answer: str, contexts: list[str]) -> dict:
    """
    Runs the full RAGAS metric suite for a single query/answer/context set.
    Returns faithfulness, answer_relevancy, and reference-free context_precision.
    Each call builds a fresh one-row dataset for the supplied system only.
    """
    Dataset, ragas_evaluate, metrics, precision_name = _load_ragas_components()
    llm = _get_ragas_llm()
    embeddings = _get_ragas_embeddings()

    if not contexts:
        raise ValueError("RAGAS requires at least one retrieved context.")

    dataset = Dataset.from_dict({
        "user_input": [query],
        "response": [answer],
        "retrieved_contexts": [contexts],
    })

    result = ragas_evaluate(
        dataset,
        metrics=metrics,
        llm=llm,
        embeddings=embeddings,
        raise_exceptions=True,
        show_progress=False,
    )
    df = result.to_pandas()

    scores = {
        "faithfulness": _safe_float(df["faithfulness"][0]) if "faithfulness" in df.columns else None,
        "answer_relevancy": _safe_float(df["answer_relevancy"][0]) if "answer_relevancy" in df.columns else None,
        "context_precision": _safe_float(df[precision_name][0]) if precision_name in df.columns else None,
    }
    missing = [name for name, value in scores.items() if value is None]
    if missing:
        raise RuntimeError(f"RAGAS returned no score for required metric(s): {', '.join(missing)}")
    return scores