"""
Content indexing pipeline.

Converts platform content (CurrentAffairs, PYQs, QuizQuestions, DailyQuestions)
into token-sized chunks stored in content_chunks with embeddings for RAG retrieval.

Public API:
    index_source(db, source_type, source_id)  — index/re-index a single item
    delete_source(db, source_type, source_id) — remove all chunks for an item
    backfill_all(triggered_by="system")       — index every published/approved item

source_type values: affair | pyq | quiz | daily_q | ncert
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import Literal

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import (
    ContentChunk,
    CurrentAffair,
    DailyQuestion,
    PastYearProblem,
    QuizQuestion,
)
from app.services import reindex_status
from app.services.chunking import split_into_chunks
from app.services.embedding_service import embed_texts

logger = logging.getLogger(__name__)

SourceType = Literal["affair", "pyq", "quiz", "daily_q", "ncert"]

# ── Text extraction helpers ───────────────────────────────────────────────────


def _affair_text(item: CurrentAffair) -> tuple[str, dict]:
    parts = [item.title or ""]
    if item.summary:
        parts.append(item.summary)
    if item.detailed_notes:
        parts.append(item.detailed_notes)
    if item.syllabus_links:
        parts.append(f"Syllabus: {item.syllabus_links}")
    if item.subject_tags:
        parts.append(f"Topics: {item.subject_tags}")
    meta = {
        "published_date": str(item.published_date) if item.published_date else None,
        "source_name": item.source_name,
        "source_url": item.source_url,
    }
    return "\n\n".join(p for p in parts if p), meta


def _pyq_text(item: PastYearProblem) -> tuple[str, dict]:
    parts = [item.question_text or ""]
    if item.option_a:
        parts.append(f"(A) {item.option_a}  (B) {item.option_b}  (C) {item.option_c}  (D) {item.option_d}")
    if item.explanation:
        parts.append(f"Explanation: {item.explanation}")
    meta = {
        "year": item.year,
        "exam_type": item.exam_type.value if item.exam_type else None,
        "paper": item.paper,
    }
    return "\n\n".join(p for p in parts if p), meta


def _quiz_text(item: QuizQuestion) -> tuple[str, dict]:
    parts = [item.question_text or ""]
    parts.append(f"(A) {item.option_a}  (B) {item.option_b}  (C) {item.option_c}  (D) {item.option_d}")
    if item.explanation:
        parts.append(f"Explanation: {item.explanation}")
    meta = {"difficulty": item.difficulty, "source": item.source}
    return "\n\n".join(p for p in parts if p), meta


def _daily_q_text(item: DailyQuestion) -> tuple[str, dict]:
    parts = [item.title or "", item.content or ""]
    if item.model_answer:
        parts.append(f"Model answer: {item.model_answer}")
    meta = {"marks": item.marks, "word_limit": item.word_limit}
    return "\n\n".join(p for p in parts if p), meta


# ── SHA-256 hash ─────────────────────────────────────────────────────────────

def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ── Core indexing logic ───────────────────────────────────────────────────────

def delete_source(db: Session, source_type: str, source_id: int) -> int:
    """Remove all chunks for a single source item. Returns number deleted."""
    deleted = (
        db.query(ContentChunk)
        .filter(
            ContentChunk.source_type == source_type,
            ContentChunk.source_id == source_id,
        )
        .delete()
    )
    return deleted


def atomic_replace_chunks(
    db: Session,
    source_type: str,
    source_id: int,
    chunks: list[ContentChunk],
) -> int:
    """
    Atomically replace all chunks for one source.

    Embedding/API work must happen *before* calling this. On any DB error
    (dimension mismatch, constraint violation, etc.) the transaction is rolled
    back so existing chunks are preserved.
    """
    try:
        delete_source(db, source_type, source_id)
        for chunk in chunks:
            db.add(chunk)
        db.flush()  # surface vector/type errors before commit
        db.commit()
        return len(chunks)
    except Exception:
        db.rollback()
        raise


def index_source(
    db: Session,
    source_type: SourceType,
    source_id: int,
    *,
    force: bool = False,
) -> int:
    """
    Index (or re-index) a single content item.
    Skips chunks whose content_hash hasn't changed (unless force=True).
    Returns the number of chunks written.
    """
    # Load the source row
    item: CurrentAffair | PastYearProblem | QuizQuestion | DailyQuestion | None = None
    title = ""
    language = "en"
    gs_paper = None
    subject = None

    if source_type == "affair":
        item = db.query(CurrentAffair).filter(CurrentAffair.id == source_id).first()
        if not item or not item.is_published:
            return 0
        text, meta = _affair_text(item)
        title = item.title or ""
        language = item.language or "en"
        gs_paper = item.gs_paper
        subject = item.subject_tags

    elif source_type == "pyq":
        item = db.query(PastYearProblem).filter(PastYearProblem.id == source_id).first()
        if not item:
            return 0
        text, meta = _pyq_text(item)
        title = (item.question_text or "")[:200]
        language = item.language or "hi"
        gs_paper = item.paper
        subject = item.subject

    elif source_type == "quiz":
        item = db.query(QuizQuestion).filter(QuizQuestion.id == source_id).first()
        if not item or not item.is_approved:
            return 0
        text, meta = _quiz_text(item)
        title = (item.question_text or "")[:200]
        language = item.language or "hi"
        subject = item.subject

    elif source_type == "daily_q":
        item = db.query(DailyQuestion).filter(DailyQuestion.id == source_id).first()
        if not item:
            return 0
        text, meta = _daily_q_text(item)
        title = item.title or ""
        subject = item.subject

    else:
        logger.warning("Unknown source_type: %s", source_type)
        return 0

    if not text or not text.strip():
        return 0

    # Split into chunks
    raw_chunks = split_into_chunks(text)
    if not raw_chunks:
        return 0

    # Check existing hashes to skip unchanged chunks
    existing_hashes: set[str] = set()
    if not force:
        existing = (
            db.query(ContentChunk.content_hash)
            .filter(
                ContentChunk.source_type == source_type,
                ContentChunk.source_id == source_id,
            )
            .all()
        )
        existing_hashes = {row[0] for row in existing}

    new_chunk_texts = []
    new_chunk_meta = []
    for idx, (chunk_text, token_count) in enumerate(raw_chunks):
        h = _sha256(chunk_text)
        if h in existing_hashes and not force:
            continue
        new_chunk_texts.append(chunk_text)
        new_chunk_meta.append((idx, chunk_text, token_count, h))

    if not new_chunk_texts:
        return 0  # nothing to update

    # Embed all new chunks in one call (outside DB transaction)
    embeddings = embed_texts(new_chunk_texts)

    # Map embeddings for changed chunks; unchanged chunks get None embedding
    all_embeddings_map: dict[int, list[float]] = {}
    for local_i, (idx, _, _, _) in enumerate(new_chunk_meta):
        all_embeddings_map[idx] = embeddings[local_i]

    # Rebuild full chunk list so chunk_index stays consistent
    chunk_rows: list[ContentChunk] = []
    for idx, (chunk_text, token_count) in enumerate(raw_chunks):
        h = _sha256(chunk_text)
        emb = all_embeddings_map.get(idx)
        chunk_rows.append(ContentChunk(
            source_type=source_type,
            source_id=source_id,
            chunk_index=idx,
            chunk_text=chunk_text,
            token_count=token_count,
            content_hash=h,
            language=language,
            gs_paper=gs_paper,
            subject=subject[:100] if subject else None,
            title=title[:400] if title else None,
            metadata_json=json.dumps(meta),
            embedding=emb,
        ))

    return atomic_replace_chunks(db, source_type, source_id, chunk_rows)


# ── Backfill all published content ───────────────────────────────────────────

def backfill_all(triggered_by: str = "system") -> dict:
    """
    Walk all published/approved content and index anything not yet embedded.
    Called once at first run and nightly by the scheduler.
    Safe to run repeatedly — skips unchanged chunks.
    """
    from app.services import reindex_status as status

    status.reset()

    def _log(level: str, msg: str) -> None:
        getattr(logger, level, logger.info)(msg)
        status.append_log(level, msg)

    _log("info", f"Backfill started (triggered_by={triggered_by})")

    db = SessionLocal()
    counts = {"affair": 0, "pyq": 0, "quiz": 0, "daily_q": 0, "errors": 0}

    try:
        # --- Current Affairs ---
        affairs = db.query(CurrentAffair).filter(CurrentAffair.is_published == True).all()
        _log("info", f"Indexing {len(affairs)} published current affairs…")
        for item in affairs:
            try:
                n = index_source(db, "affair", item.id)
                counts["affair"] += n
            except Exception as exc:
                db.rollback()
                counts["errors"] += 1
                _log("error", f"Failed to index affair {item.id}: {exc}")
            time.sleep(0.2)  # throttle embedding API

        # --- Past Year Problems ---
        pyqs = db.query(PastYearProblem).all()
        _log("info", f"Indexing {len(pyqs)} past year problems…")
        for item in pyqs:
            try:
                n = index_source(db, "pyq", item.id)
                counts["pyq"] += n
            except Exception as exc:
                db.rollback()
                counts["errors"] += 1
                _log("error", f"Failed to index PYQ {item.id}: {exc}")
            time.sleep(0.2)

        # --- Quiz Questions ---
        quizzes = db.query(QuizQuestion).filter(QuizQuestion.is_approved == True).all()
        _log("info", f"Indexing {len(quizzes)} approved quiz questions…")
        for item in quizzes:
            try:
                n = index_source(db, "quiz", item.id)
                counts["quiz"] += n
            except Exception as exc:
                db.rollback()
                counts["errors"] += 1
                _log("error", f"Failed to index quiz {item.id}: {exc}")
            time.sleep(0.2)

        # --- Daily Questions ---
        daily_qs = db.query(DailyQuestion).all()
        _log("info", f"Indexing {len(daily_qs)} daily questions…")
        for item in daily_qs:
            try:
                n = index_source(db, "daily_q", item.id)
                counts["daily_q"] += n
            except Exception as exc:
                db.rollback()
                counts["errors"] += 1
                _log("error", f"Failed to index daily_q {item.id}: {exc}")
            time.sleep(0.2)

        result = {
            "chunks_written": counts,
            "total": sum(v for k, v in counts.items() if k != "errors"),
            "errors": counts["errors"],
        }
        _log("info", f"Backfill complete: {result}")
        status.complete(result)
        return result

    except Exception as exc:
        db.rollback()
        _log("error", f"Backfill failed: {exc}")
        status.fail(str(exc))
        return {"error": str(exc)}
    finally:
        db.close()
