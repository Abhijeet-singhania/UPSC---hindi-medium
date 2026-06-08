"""
RAG (Retrieval-Augmented Generation) service.

retrieve() — vector-similarity search over content_chunks
build_context() — trim retrieved chunks to a token budget
generate() — call Gemini with a UPSC-tutor system prompt + context

Also exposes find_related() for the cross-linking feature:
  given a source item, find semantically similar items of other types.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import ContentChunk
from app.services.chunking import count_tokens
from app.services.embedding_service import embed_single, embed_texts

logger = logging.getLogger(__name__)

# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are a knowledgeable and supportive UPSC preparation mentor for Hindi-medium aspirants.

Your role:
- Answer questions about the UPSC syllabus (Prelims & Mains: GS1/GS2/GS3/GS4, Essay, Optional subjects)
- Explain concepts clearly with real examples relevant to India
- Connect current affairs to syllabus topics when relevant
- Cite the specific source documents provided to you (refer to them as [1], [2], etc.)
- For factual UPSC questions, always be accurate — if unsure, say so
- Encourage the aspirant with practical study advice

Response rules:
- Always respond in the SAME LANGUAGE as the user's question (Hindi or English)
- Be concise but thorough: cover the key points an examiner expects
- Use headings and bullet points for structured answers (Mains-style)
- End with a 1-line takeaway for UPSC preparation when relevant
- NEVER make up facts — ground all claims in the provided context
"""

# ── Retrieval ─────────────────────────────────────────────────────────────────

def retrieve(
    db: Session,
    query: str,
    top_k: Optional[int] = None,
    source_types: Optional[list[str]] = None,
    language: Optional[str] = None,
    gs_paper: Optional[str] = None,
    subject: Optional[str] = None,
) -> list[ContentChunk]:
    """
    Vector-similarity search over content_chunks.
    Returns the top-k most semantically similar chunks to `query`.
    """
    k = top_k or settings.AI_RETRIEVAL_TOP_K
    query_vec = embed_single(query, task_type="RETRIEVAL_QUERY")

    # Build the base SQL — pgvector cosine distance operator <=>
    filters = ["embedding IS NOT NULL"]
    params: dict = {"query_vec": str(query_vec), "limit": k}

    if source_types:
        placeholders = ", ".join(f":st{i}" for i in range(len(source_types)))
        filters.append(f"source_type IN ({placeholders})")
        for i, st in enumerate(source_types):
            params[f"st{i}"] = st

    if language:
        filters.append("(language = :language OR language IS NULL)")
        params["language"] = language

    if gs_paper:
        filters.append("(gs_paper = :gs_paper OR gs_paper IS NULL)")
        params["gs_paper"] = gs_paper

    if subject:
        filters.append("subject ILIKE :subject")
        params["subject"] = f"%{subject}%"

    where_clause = " AND ".join(filters)
    sql = text(
        f"""
        SELECT id, source_type, source_id, chunk_text, title,
               language, gs_paper, subject, metadata_json,
               1 - (embedding <=> :query_vec::vector) AS similarity
        FROM content_chunks
        WHERE {where_clause}
        ORDER BY embedding <=> :query_vec::vector
        LIMIT :limit
        """
    )

    try:
        rows = db.execute(sql, params).fetchall()
    except Exception as exc:
        logger.warning("Vector search failed (pgvector may not be ready): %s", exc)
        return []

    # Map rows to ContentChunk-like dicts (avoid a second round-trip)
    chunks = []
    for row in rows:
        c = ContentChunk()
        c.id = row.id
        c.source_type = row.source_type
        c.source_id = row.source_id
        c.chunk_text = row.chunk_text
        c.title = row.title
        c.language = row.language
        c.gs_paper = row.gs_paper
        c.subject = row.subject
        c.metadata_json = row.metadata_json
        c._similarity = getattr(row, "similarity", 0.0)
        chunks.append(c)

    return chunks


# ── Context building ──────────────────────────────────────────────────────────

def build_context(chunks: list[ContentChunk]) -> tuple[str, list[dict]]:
    """
    Concatenate chunks into a context string within `AI_CONTEXT_MAX_TOKENS`.
    Returns (context_text, citation_list).

    citation_list entries:
        {"index": 1, "source_type": "affair", "source_id": 7, "title": "…"}
    """
    max_tokens = settings.AI_CONTEXT_MAX_TOKENS
    used = 0
    context_parts = []
    citations = []
    seen: set[tuple[str, int]] = set()  # deduplicate same source

    for chunk in chunks:
        key = (chunk.source_type, chunk.source_id)
        token_count = count_tokens(chunk.chunk_text)

        if used + token_count > max_tokens:
            if not context_parts:
                # At least include one chunk even if it exceeds budget
                pass
            else:
                break

        if key not in seen:
            citation_idx = len(citations) + 1
            citations.append({
                "index": citation_idx,
                "source_type": chunk.source_type,
                "source_id": chunk.source_id,
                "title": chunk.title or f"{chunk.source_type.upper()} #{chunk.source_id}",
                "gs_paper": chunk.gs_paper,
                "subject": chunk.subject,
                "metadata": json.loads(chunk.metadata_json) if chunk.metadata_json else {},
            })
            seen.add(key)
        else:
            citation_idx = next(
                c["index"] for c in citations
                if c["source_type"] == chunk.source_type and c["source_id"] == chunk.source_id
            )

        context_parts.append(f"[{citation_idx}] {chunk.chunk_text}")
        used += token_count

    context_text = "\n\n---\n\n".join(context_parts)
    return context_text, citations


# ── Generation ────────────────────────────────────────────────────────────────

def generate(
    query: str,
    context: str,
    language: str = "en",
) -> str:
    """
    Send query + context to Gemini and return the grounded answer.
    Falls back to a helpful no-context message if Gemini is unavailable.
    """
    if not settings.GEMINI_API_KEY:
        return (
            "AI mentor is not configured. Please set GEMINI_API_KEY in the server environment "
            "to enable this feature."
        )

    lang_instruction = (
        "Respond in Hindi (Devanagari script)."
        if language == "hi"
        else "Respond in English."
    )

    user_prompt = (
        f"Context from UPSC study materials (cite by number):\n\n"
        f"{context}\n\n"
        f"---\n\n"
        f"Question: {query}\n\n"
        f"{lang_instruction}"
    )

    for attempt in range(1, 4):
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=_SYSTEM_PROMPT,
                    temperature=0.4,
                    max_output_tokens=2048,
                ),
            )
            return response.text or "I could not generate a response. Please try rephrasing your question."
        except Exception as exc:
            err = str(exc)
            if "429" in err or "quota" in err.lower():
                wait = 5 * attempt
                logger.warning("Gemini quota on generate (attempt %d). Waiting %ds…", attempt, wait)
                time.sleep(wait)
            else:
                logger.error("Gemini generate error (attempt %d): %s", attempt, exc)
                break

    return "AI mentor is temporarily unavailable. Please try again in a few minutes."


# ── Cross-linking: find_related ───────────────────────────────────────────────

def find_related(
    db: Session,
    source_type: str,
    source_id: int,
    want_types: Optional[list[str]] = None,
    top_k: int = 5,
) -> dict[str, list[dict]]:
    """
    Find semantically similar items of other source types for a given item.

    Returns:
        {
          "affairs": [{"source_id": 3, "title": "…", "similarity": 0.87}, …],
          "pyqs":    […],
          "quizzes": […],
        }
    """
    # Get the representative text for the source item
    source_chunks = (
        db.query(ContentChunk)
        .filter(
            ContentChunk.source_type == source_type,
            ContentChunk.source_id == source_id,
        )
        .order_by(ContentChunk.chunk_index)
        .limit(3)
        .all()
    )

    if not source_chunks:
        return {}

    # Use the first chunk as the query
    query_text = " ".join(c.chunk_text for c in source_chunks[:2])[:2000]

    all_types = ["affair", "pyq", "quiz", "daily_q"]
    if want_types:
        target_types = [t for t in want_types if t != source_type and t in all_types]
    else:
        target_types = [t for t in all_types if t != source_type]

    if not target_types:
        return {}

    query_vec = embed_single(query_text, task_type="RETRIEVAL_QUERY")

    placeholders = ", ".join(f":st{i}" for i in range(len(target_types)))
    params: dict = {
        "query_vec": str(query_vec),
        "limit": top_k * len(target_types),
    }
    for i, st in enumerate(target_types):
        params[f"st{i}"] = st

    sql = text(
        f"""
        SELECT DISTINCT ON (source_type, source_id)
               source_type, source_id, title, gs_paper, subject, metadata_json,
               1 - (embedding <=> :query_vec::vector) AS similarity
        FROM content_chunks
        WHERE embedding IS NOT NULL
          AND source_type IN ({placeholders})
        ORDER BY source_type, source_id,
                 embedding <=> :query_vec::vector
        """
    )

    try:
        rows = db.execute(sql, params).fetchall()
    except Exception as exc:
        logger.warning("find_related vector search failed: %s", exc)
        return {}

    # Sort globally by similarity and bucket by type
    sorted_rows = sorted(rows, key=lambda r: r.similarity, reverse=True)

    result: dict[str, list[dict]] = {}
    type_counts: dict[str, int] = {}
    type_key_map = {"affair": "affairs", "pyq": "pyqs", "quiz": "quizzes", "daily_q": "daily_questions"}

    for row in sorted_rows:
        st = row.source_type
        if type_counts.get(st, 0) >= top_k:
            continue
        key = type_key_map.get(st, st)
        if key not in result:
            result[key] = []
        meta = json.loads(row.metadata_json) if row.metadata_json else {}
        result[key].append({
            "source_id": row.source_id,
            "title": row.title or f"{st} #{row.source_id}",
            "gs_paper": row.gs_paper,
            "subject": row.subject,
            "similarity": round(float(row.similarity), 3),
            **meta,
        })
        type_counts[st] = type_counts.get(st, 0) + 1

    return result
