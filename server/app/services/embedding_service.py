"""
Embedding service — wraps Gemini embedding models (default: gemini-embedding-2).

Usage:
    from app.services.embedding_service import embed_texts, embed_single

    vectors = embed_texts(["India's federal structure", "RTI Act 2005"])
    # → [[0.12, -0.03, ...], [0.08, 0.22, ...]]   (GEMINI_EMBEDDING_DIM floats each)

gemini-embedding-2 outputs 3072 dims by default; we request GEMINI_EMBEDDING_DIM (768)
via output_dimensionality so vectors fit content_chunks.embedding VECTOR(768).

Batching + retry logic mirrors ca_ingestion.py to stay within the free-tier limits.
"""
from __future__ import annotations

import logging
import math
import time
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# ── Gemini client (lazy singleton) ───────────────────────────────────────────

_client = None


def _get_client():
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to server/.env to enable AI features."
            )
        from google import genai
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# ── Public API ────────────────────────────────────────────────────────────────

EMBEDDING_DIM = settings.GEMINI_EMBEDDING_DIM
_BATCH_SIZE = 20           # chunks per Gemini embed_content call
_RETRY_DELAY_SEC = 15      # base wait on per-minute 429
_MAX_RETRIES = 4
_INTER_BATCH_DELAY_SEC = 2  # ~10 batches/min → well inside 1 500 RPM free limit


def _l2_normalize(vec: list[float]) -> list[float]:
    """L2-normalize a vector (required for truncated gemini-embedding-001 dims)."""
    norm = math.sqrt(sum(x * x for x in vec))
    if norm <= 0:
        return vec
    return [x / norm for x in vec]


def _finalize_embedding(vec: list[float]) -> list[float]:
    """Ensure vector matches DB dimension and is normalized for cosine search."""
    if len(vec) != EMBEDDING_DIM:
        raise ValueError(
            f"Embedding dimension mismatch: got {len(vec)}, expected {EMBEDDING_DIM}. "
            f"Set GEMINI_EMBEDDING_DIM={len(vec)} and migrate content_chunks.embedding, "
            f"or use a model/config that returns {EMBEDDING_DIM} dimensions."
        )
    # gemini-embedding-2 auto-normalizes truncated dims; gemini-embedding-001 does not.
    # Extra L2 pass is harmless (idempotent) and keeps cosine search consistent.
    if EMBEDDING_DIM < 3072:
        return _l2_normalize(vec)
    return vec


def embed_texts(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    """
    Embed a list of texts.  Returns a parallel list of 768-dim float vectors.
    Empty / whitespace strings return a zero-vector so callers don't need to
    special-case them.
    """
    if not texts:
        return []

    logger.info("Embedding %d texts task_type=%s", len(texts), task_type)
    results: list[list[float] | None] = [None] * len(texts)
    non_empty = [(i, t) for i, t in enumerate(texts) if t and t.strip()]

    # Process in batches
    for batch_start in range(0, len(non_empty), _BATCH_SIZE):
        batch = non_empty[batch_start: batch_start + _BATCH_SIZE]
        indices, batch_texts = zip(*batch)

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                from google.genai import types as _types
                client = _get_client()
                response = client.models.embed_content(
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    contents=list(batch_texts),
                    config=_types.EmbedContentConfig(
                        task_type=task_type,
                        output_dimensionality=EMBEDDING_DIM,
                    ),
                )
                for local_i, embedding in enumerate(response.embeddings):
                    results[indices[local_i]] = _finalize_embedding(list(embedding.values))
                break
            except Exception as exc:
                err_str = str(exc)
                is_daily_quota = "429" in err_str and (
                    "daily" in err_str.lower()
                    or "exhausted" in err_str.lower()
                    or "RESOURCE_EXHAUSTED" in err_str
                )
                is_rate_limit = "429" in err_str or "quota" in err_str.lower()
                if is_daily_quota:
                    # Daily cap hit — no point retrying; fail fast with a clear message
                    logger.error(
                        "Gemini daily embedding quota exhausted. "
                        "Upgrade the plan or wait until midnight UTC for the quota to reset."
                    )
                    raise RuntimeError(
                        "Gemini daily quota exhausted. Quota resets at midnight UTC. "
                        "Try again tomorrow or upgrade to a paid plan."
                    )
                elif is_rate_limit:
                    wait = _RETRY_DELAY_SEC * attempt
                    logger.warning(
                        "Gemini embedding rate-limit hit (attempt %d/%d). Waiting %ds…",
                        attempt, _MAX_RETRIES, wait,
                    )
                    time.sleep(wait)
                else:
                    logger.error("Embedding error on attempt %d: %s", attempt, exc)
                    if attempt == _MAX_RETRIES:
                        # Return zero vectors for this batch so we degrade gracefully
                        for idx in indices:
                            results[idx] = [0.0] * EMBEDDING_DIM
                    else:
                        time.sleep(_RETRY_DELAY_SEC)

        if batch_start + _BATCH_SIZE < len(non_empty):
            time.sleep(_INTER_BATCH_DELAY_SEC)

    # Fill None slots (empty inputs) with zero-vectors
    zero = [0.0] * EMBEDDING_DIM
    out = [r if r is not None else zero for r in results]
    logger.info("Embedding complete vectors=%d dim=%d", len(out), EMBEDDING_DIM)
    return out


def embed_single(text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
    """Embed a single query string."""
    results = embed_texts([text], task_type=task_type)
    return results[0] if results else [0.0] * EMBEDDING_DIM
