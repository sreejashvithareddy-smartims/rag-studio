"""
Thin wrapper around embeddings + chat generation so the rest of the app
never has to care which provider is doing the work.

Embeddings:
  - "local"  (default) -> sentence-transformers, runs on your machine, FREE, no key
  - "openai"            -> OpenAI text-embedding-3-small, paid, requires OPENAI_API_KEY

Generation:
  - "gemini"    (default) -> Google Gemini free tier, requires GEMINI_API_KEY
  - "groq"                -> Groq free tier (Llama models), requires GROQ_API_KEY
  - "openai"               -> paid, requires OPENAI_API_KEY
  - "anthropic"            -> paid, requires ANTHROPIC_API_KEY
"""
import numpy as np
from config import settings

# ------------------------------------------------------------------
# Embeddings
# ------------------------------------------------------------------

_local_embedder = None
_openai_client_embed = None


def _get_local_embedder():
    global _local_embedder
    if _local_embedder is None:
        from sentence_transformers import SentenceTransformer
        _local_embedder = SentenceTransformer(settings.LOCAL_EMBEDDING_MODEL)
    return _local_embedder


def embed_texts(texts: list[str]) -> np.ndarray:
    """Returns an (n, d) numpy array of embeddings."""
    if not texts:
        return np.zeros((0, 384), dtype=np.float32)

    provider = settings.EMBEDDING_PROVIDER.lower()

    if provider == "local":
        model = _get_local_embedder()
        return np.array(model.encode(texts, show_progress_bar=False), dtype=np.float32)

    if provider == "openai":
        global _openai_client_embed
        if _openai_client_embed is None:
            from openai import OpenAI
            if not settings.OPENAI_API_KEY:
                raise RuntimeError("OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai")
            _openai_client_embed = OpenAI(api_key=settings.OPENAI_API_KEY)
        out = []
        batch_size = 96
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            resp = _openai_client_embed.embeddings.create(model=settings.EMBEDDING_MODEL, input=batch)
            out.extend([d.embedding for d in resp.data])
        return np.array(out, dtype=np.float32)

    raise RuntimeError(f"Unknown EMBEDDING_PROVIDER '{provider}'. Use 'local' or 'openai'.")


def embed_query(text: str) -> np.ndarray:
    return embed_texts([text])[0]


# ------------------------------------------------------------------
# Chat generation
# ------------------------------------------------------------------

_gemini_configured = False
_groq_client = None
_openai_client_chat = None
_anthropic_client = None


def _chat_gemini(prompt: str, system: str, temperature: float, max_tokens: int) -> str:
    global _gemini_configured
    import google.generativeai as genai
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini. Get a free key at https://aistudio.google.com/apikey")
    if not _gemini_configured:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _gemini_configured = True
    model = genai.GenerativeModel(settings.GEMINI_CHAT_MODEL, system_instruction=system or None)
    resp = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(temperature=temperature, max_output_tokens=max_tokens),
    )
    return (resp.text or "").strip()


def _chat_groq(prompt: str, system: str, temperature: float, max_tokens: int) -> str:
    global _groq_client
    if _groq_client is None:
        from openai import OpenAI  # Groq exposes an OpenAI-compatible API
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is required when LLM_PROVIDER=groq. Get a free key at https://console.groq.com/keys")
        _groq_client = OpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    resp = _groq_client.chat.completions.create(
        model=settings.GROQ_CHAT_MODEL,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system or "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
    )
    return resp.choices[0].message.content.strip()


def _chat_openai(prompt: str, system: str, temperature: float, max_tokens: int) -> str:
    global _openai_client_chat
    if _openai_client_chat is None:
        from openai import OpenAI
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        _openai_client_chat = OpenAI(api_key=settings.OPENAI_API_KEY)
    resp = _openai_client_chat.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system or "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
    )
    return resp.choices[0].message.content.strip()


def _chat_anthropic(prompt: str, system: str, temperature: float, max_tokens: int) -> str:
    global _anthropic_client
    if _anthropic_client is None:
        from anthropic import Anthropic
        if not settings.ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic")
        _anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    resp = _anthropic_client.messages.create(
        model=settings.ANTHROPIC_CHAT_MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system or "You are a helpful assistant.",
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(block.text for block in resp.content if block.type == "text").strip()


_PROVIDERS = {
    "gemini": _chat_gemini,
    "groq": _chat_groq,
    "openai": _chat_openai,
    "anthropic": _chat_anthropic,
}


def chat(prompt: str, system: str = "", temperature: float = 0.2, max_tokens: int = 1000) -> str:
    provider = settings.LLM_PROVIDER.lower()
    if provider not in _PROVIDERS:
        raise RuntimeError(f"Unknown LLM_PROVIDER '{provider}'. Use one of: {list(_PROVIDERS.keys())}")
    return _PROVIDERS[provider](prompt, system, temperature, max_tokens)


def cosine_sim_matrix(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Cosine similarity of one vector against a matrix of vectors."""
    q = query_vec / (np.linalg.norm(query_vec) + 1e-8)
    m = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-8)
    return m @ q
