"""
Token-aware text chunker using tiktoken.

Splits a document into overlapping chunks suitable for embedding.
Uses cl100k_base encoding (GPT-4 / text-embedding-004 compatible).

Usage:
    from app.services.chunking import split_into_chunks

    chunks = split_into_chunks("Long article text…")
    # → [("First 300-token slice…", 300), ("250-token overlap + next…", 300)]
"""
from __future__ import annotations

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

_enc = None


def _get_enc():
    global _enc
    if _enc is None:
        import tiktoken
        _enc = tiktoken.get_encoding("cl100k_base")
    return _enc


def split_into_chunks(
    text: str,
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None,
) -> list[tuple[str, int]]:
    """
    Split *text* into overlapping token-sized chunks.

    Returns a list of (chunk_text, token_count) tuples.
    Short texts that fit in a single chunk are returned as-is.
    """
    if not text or not text.strip():
        return []

    size = chunk_size or settings.AI_CHUNK_SIZE_TOKENS
    overlap = chunk_overlap or settings.AI_CHUNK_OVERLAP_TOKENS

    enc = _get_enc()
    tokens = enc.encode(text)

    if len(tokens) <= size:
        return [(text, len(tokens))]

    chunks: list[tuple[str, int]] = []
    start = 0
    while start < len(tokens):
        end = min(start + size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text = enc.decode(chunk_tokens)
        chunks.append((chunk_text, len(chunk_tokens)))
        if end == len(tokens):
            break
        start += size - overlap

    return chunks


def count_tokens(text: str) -> int:
    """Return the token count for *text* without splitting."""
    if not text:
        return 0
    return len(_get_enc().encode(text))
