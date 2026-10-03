"""
RAGAS-based evaluation — standardized, published RAG metrics instead of
hand-written judge prompts.

- Faithfulness: are the answer's claims actually supported by the retrieved context?
- Answer Relevancy: does the answer actually address the question asked?

Embeddings always use the local sentence-transformers model (free, no key needed,
consistent with the rest of the app). The judge LLM uses whichever provider is
configured for generation (OpenAI or Gemini) via LangChain wrappers, since RAGAS
requires LangChain-compatible LLM/embedding objects.
"""
from datasets import Dataset
from ragas import evaluate as ragas_evaluate
from ragas.metrics import faithfulness, answer_relevancy
from langchain_huggingface import HuggingFaceEmbeddings
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
        _embeddings_cache = HuggingFaceEmbeddings(model_name=settings.LOCAL_EMBEDDING_MODEL)
    return _embeddings_cache


def ragas_score(query: str, answer: str, contexts: list[str]) -> dict:
    """
    Runs RAGAS faithfulness + answer_relevancy for a single query/answer/context set.
    Returns {"faithfulness": float 0-1, "answer_relevancy": float 0-1}.
    Raises on failure — caller should catch and fall back if needed.
    """
    llm = _get_ragas_llm()
    embeddings = _get_ragas_embeddings()

    dataset = Dataset.from_dict({
        "question": [query],
        "answer": [answer],
        "contexts": [contexts if contexts else [""]],
    })

    result = ragas_evaluate(
        dataset,
        metrics=[faithfulness, answer_relevancy],
        llm=llm,
        embeddings=embeddings,
    )
    df = result.to_pandas()

    faith = df["faithfulness"][0] if "faithfulness" in df.columns else None
    rel = df["answer_relevancy"][0] if "answer_relevancy" in df.columns else None

    return {
        "faithfulness": float(faith) if faith is not None and faith == faith else None,
        "answer_relevancy": float(rel) if rel is not None and rel == rel else None,
    }