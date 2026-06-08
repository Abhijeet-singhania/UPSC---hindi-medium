"""
NCERT / study-material ingestion pipeline (Phase 6).

When you have NCERT PDFs or structured text files, drop them into a watched
directory and run ingest_document() to chunk → embed → store in content_chunks
with source_type='ncert'.

Usage (once you have content):
    from app.services.ncert_ingestion import ingest_document
    ingest_document(
        file_path="/data/ncert/class11_polity.pdf",
        book_name="NCERT Class 11 Political Science",
        subject="Polity",
        language="en",
    )

The StudyContent page will automatically surface NCERT chunks once indexed
because they share the same content_chunks table as all other content.
Cross-linking (find_related) works automatically — no extra code needed.

Admin bulk-import:
    POST /api/v1/ai/admin/ncert-ingest (not yet implemented — placeholder below)
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


def ingest_document(
    file_path: str,
    book_name: str,
    subject: str,
    language: str = "en",
    gs_paper: Optional[str] = None,
    chapter: Optional[str] = None,
) -> dict:
    """
    Ingest a single PDF or plain-text file into the content_chunks vector index.

    Steps:
      1. Extract text (PDF via pdfplumber, .txt directly)
      2. Chunk with chunking.split_into_chunks()
      3. Embed with embedding_service.embed_texts()
      4. Upsert ContentChunk rows with source_type='ncert'

    Returns {"chunks_written": N, "book": book_name}
    """
    from app.db.database import SessionLocal
    from app.db.models import ContentChunk
    from app.services.chunking import split_into_chunks
    from app.services.embedding_service import embed_texts

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"NCERT file not found: {file_path}")

    # ── Extract text ──────────────────────────────────────────────────────────
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        import pdfplumber
        pages = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages.append(page_text)
        raw_text = "\n\n".join(pages)
    elif ext in (".txt", ".md"):
        with open(file_path, encoding="utf-8") as f:
            raw_text = f.read()
    else:
        raise ValueError(f"Unsupported file type: {ext}. Use PDF or plain text.")

    if not raw_text.strip():
        logger.warning("No text extracted from %s", file_path)
        return {"chunks_written": 0, "book": book_name}

    # ── Chunk ─────────────────────────────────────────────────────────────────
    chunks = split_into_chunks(raw_text)
    if not chunks:
        return {"chunks_written": 0, "book": book_name}

    # Use book_name + chapter as a stable key so re-uploads overwrite correctly
    _key = f"{book_name}::{chapter or ''}"
    source_id = int(hashlib.sha256(_key.encode()).hexdigest()[:8], 16) % 2_000_000_000

    # ── Embed ─────────────────────────────────────────────────────────────────
    texts = [t for t, _ in chunks]
    embeddings = embed_texts(texts)

    # ── Persist ───────────────────────────────────────────────────────────────
    db = SessionLocal()
    try:
        # Remove any previous chunks for this document
        db.query(ContentChunk).filter(
            ContentChunk.source_type == "ncert",
            ContentChunk.source_id == source_id,
        ).delete()

        for idx, ((chunk_text, token_count), emb) in enumerate(zip(chunks, embeddings)):
            h = hashlib.sha256(chunk_text.encode()).hexdigest()
            meta = {"book": book_name, "chapter": chapter, "file": os.path.basename(file_path)}
            db.add(ContentChunk(
                source_type="ncert",
                source_id=source_id,
                chunk_index=idx,
                chunk_text=chunk_text,
                token_count=token_count,
                content_hash=h,
                language=language,
                gs_paper=gs_paper,
                subject=subject,
                title=f"{book_name}{' — ' + chapter if chapter else ''}",
                metadata_json=json.dumps(meta),
                embedding=emb,
            ))

        db.commit()
        logger.info("NCERT ingest: %d chunks written for %s", len(chunks), book_name)
        return {
            "chunks_written": len(chunks),
            "book": book_name,
            "source_id": source_id,
            "file": os.path.basename(file_path),
        }
    except Exception as exc:
        db.rollback()
        logger.error("NCERT ingest failed: %s", exc)
        raise
    finally:
        db.close()


def list_indexed_books(db) -> list[dict]:
    """Return a list of all NCERT books currently indexed."""
    from app.db.models import ContentChunk
    rows = (
        db.query(ContentChunk.source_id, ContentChunk.title, ContentChunk.subject)
        .filter(ContentChunk.source_type == "ncert")
        .distinct()
        .all()
    )
    seen = {}
    for source_id, title, subject in rows:
        if source_id not in seen:
            seen[source_id] = {"source_id": source_id, "title": title, "subject": subject}
    return list(seen.values())
