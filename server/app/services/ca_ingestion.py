"""
Current Affairs ingestion pipeline.

Architecture
────────────
  APScheduler (07:30 IST daily)
    └─ run_ingestion()
         ├─ fetch_rss_feeds()          ← free, no API key needed
         ├─ fetch_article_body()       ← full text from source URL when RSS is thin
         ├─ deduplicate()              ← skip already-saved titles
         ├─ (optional) gemini_process() ← max 2 articles/run (GEMINI_API_KEY)
         └─ save to DB                 ← is_published=False; admin reviews
"""

from __future__ import annotations

import json
import logging
import re
import time
from datetime import date
from html import unescape
from html.parser import HTMLParser
from typing import Optional

from app.constants import (
    CA_INGESTION_DEFAULT_GEMINI_MODEL,
    CA_INGESTION_GEMINI_DELAY_SEC,
    CA_INGESTION_MAX_AI_ARTICLES,
    CA_INGESTION_MAX_ARTICLE_CHARS,
    CA_INGESTION_MAX_DESC_CHARS,
)

logger = logging.getLogger(__name__)

_FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; UPSC-Hindi-Bot/1.0; +https://github.com/upsc-hindi)"
    ),
}


class QuotaExhausted(Exception):
    """Raised when Gemini returns 429 — stop further AI calls this run."""


class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def get_text(self) -> str:
        return " ".join(self._parts)


# ── RSS helpers ──────────────────────────────────────────────────────────────

DEFAULT_RSS_FEEDS = [
    "https://www.thehindu.com/news/national/feeder/default.rss",
    "https://pib.gov.in/RssMain.aspx",
    "https://indianexpress.com/section/india/feed/",
]


def _strip_html(text: str) -> str:
    if not text:
        return ""
    text = unescape(text)
    stripper = _HTMLStripper()
    try:
        stripper.feed(text)
        text = stripper.get_text()
    except Exception:
        text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _fetch_rss_entries(feed_urls: list[str]) -> list[dict]:
    """Parse RSS feeds and return a list of entry dicts."""
    try:
        import feedparser  # type: ignore[import]
    except ImportError:
        logger.warning("feedparser not installed — skipping RSS ingestion. Run: pip install feedparser")
        return []

    entries = []
    for url in feed_urls:
        try:
            feed = feedparser.parse(url)
            for e in feed.entries:
                raw_desc = e.get("summary", e.get("description", ""))
                entries.append({
                    "title": e.get("title", "").strip(),
                    "description": _strip_html(raw_desc),
                    "url": e.get("link", ""),
                    "source": feed.feed.get("title", url),
                    "published": e.get("published", ""),
                })
            logger.info("Fetched %d entries from %s", len(feed.entries), url)
        except Exception:
            logger.exception("Failed to fetch RSS feed: %s", url)
    return entries


def _fetch_article_body(url: str, max_chars: int = CA_INGESTION_MAX_ARTICLE_CHARS) -> str:
    """Fetch and extract readable article text from the source URL."""
    if not url:
        return ""
    try:
        import requests
        from bs4 import BeautifulSoup

        resp = requests.get(url, timeout=15, headers=_FETCH_HEADERS)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()

        candidates = []
        for selector in (
            "article",
            "[class*='article-body']",
            "[class*='story-details']",
            "[class*='full-details']",
            "[class*='entry-content']",
            "main",
        ):
            for node in soup.select(selector):
                text = node.get_text("\n", strip=True)
                if len(text) > 200:
                    candidates.append(text)

        if candidates:
            body = max(candidates, key=len)
        else:
            paragraphs = [
                p.get_text(strip=True)
                for p in soup.find_all("p")
                if len(p.get_text(strip=True)) > 40
            ]
            body = "\n\n".join(paragraphs)

        body = re.sub(r"\n{3,}", "\n\n", body).strip()
        body = _clean_article_body(body)
        return body[:max_chars]
    except Exception:
        logger.warning("Could not fetch article body: %s", url)
        return ""


def _clean_article_body(text: str) -> str:
    """Drop RSS-style bylines and very short lines from scraped article text."""
    skip_patterns = (
        r"^written by:",
        r"^\d+\s*min read",
        r"^updated:",
        r"^published:",
        r"^share$",
        r"^follow us",
        r"^whatsapp$",
        r"^twitter$",
        r"^facebook$",
        r"^reddit$",
        r"^print$",
        r"^make us preferred",
        r"^\w{3}\s+\d{1,2},\s+\d{4}",  # e.g. May 23, 2026
    )
    lines = []
    for line in re.split(r"\n+", text):
        line = line.strip()
        if len(line) < 30:
            continue
        lower = line.lower()
        if any(re.match(pat, lower) for pat in skip_patterns):
            continue
        lines.append(line)
    return "\n\n".join(lines)


def _resolve_article_text(title: str, description: str, url: str) -> str:
    """Prefer RSS description; fetch full article when RSS text is missing or just the headline."""
    text = (description or "").strip()
    title_norm = title.lower().strip()

    if len(text) < 120 or text.lower().strip() == title_norm:
        fetched = _fetch_article_body(url)
        if fetched and len(fetched) > len(text):
            text = fetched

    return text


def _extract_lead(text: str, max_chars: int = 450) -> str:
    """First substantial sentence for card summary."""
    text = text.strip()
    if not text:
        return ""
    for part in re.split(r"(?<=[.!?])\s+", text):
        part = part.strip()
        if len(part) < 60:
            continue
        lower = part.lower()
        if "image generated" in lower or lower.startswith("chennai suburban railway"):
            continue
        if len(part) > max_chars:
            part = part[: max_chars - 1].rsplit(" ", 1)[0] + "…"
        return part
    return text[:max_chars].rsplit(" ", 1)[0] + ("…" if len(text) > max_chars else "")


def _build_affair_text(title: str, full_text: str, ai_data: Optional[dict]) -> tuple[str, Optional[str]]:
    """Return (summary, detailed_notes) for DB storage."""
    if ai_data:
        return ai_data["upsc_summary"], ai_data.get("detailed_notes")

    text = (full_text or "").strip()
    if not text:
        return title, None

    text = _clean_article_body(text)
    if not text:
        return title, None

    title_norm = title.lower().strip()
    if text.lower().strip() == title_norm:
        return title, None

    summary = _extract_lead(text)
    if not summary or summary.lower().strip() == title_norm:
        summary = text[:500].rsplit(" ", 1)[0] + ("…" if len(text) > 500 else "")

    detailed = text if len(text) > len(summary) + 80 else None
    return summary, detailed


# ── Gemini helpers ───────────────────────────────────────────────────────────

_GEMINI_SYSTEM_PROMPT = """You are a UPSC CSE content curator. Given a headline and article excerpt, return JSON only.

If NOT UPSC-relevant: {"is_upsc_relevant": false}

If relevant:
{
  "is_upsc_relevant": true,
  "upsc_summary": "2-3 sentences for aspirants",
  "detailed_notes": "3-4 bullet points: key facts, syllabus link, policy angle",
  "gs_paper": "GS2",
  "subject_tags": "comma-separated tags",
  "syllabus_links": "e.g. GS2: Governance",
  "quiz_question": {
    "question_text": "...",
    "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
    "correct_option": "A",
    "explanation": "brief",
    "difficulty": "medium"
  }
}

gs_paper: GS1, GS2, GS3, GS4, Essay, or combined (GS1+GS2, etc.)
"""


def _process_with_gemini(
    api_key: str,
    title: str,
    article_text: str,
    model: str = CA_INGESTION_DEFAULT_GEMINI_MODEL,
) -> Optional[dict]:
    """
    Send article to Gemini and parse the structured JSON response.
    Returns dict if UPSC-relevant, None if not relevant.
    Raises QuotaExhausted on 429 so the caller can fall back to raw saves.
    """
    try:
        from google import genai  # type: ignore[import]
        from google.genai import types  # type: ignore[import]
        from google.genai import errors as genai_errors  # type: ignore[import]
    except ImportError:
        logger.warning("google-genai not installed — skipping AI processing. Run: pip install google-genai")
        return None

    try:
        client = genai.Client(api_key=api_key)
        excerpt = article_text[:CA_INGESTION_MAX_DESC_CHARS]
        user_prompt = f"Title: {title}\n\nArticle excerpt:\n{excerpt}"

        response = client.models.generate_content(
            model=model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=_GEMINI_SYSTEM_PROMPT,
                temperature=0.3,
                max_output_tokens=900,
            ),
        )
        raw = (response.text or "").strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        data = json.loads(raw)
        if not data.get("is_upsc_relevant", False):
            return None
        return data

    except json.JSONDecodeError:
        logger.warning("Gemini returned non-JSON for: %s", title)
        return None
    except genai_errors.ClientError as exc:
        if getattr(exc, "code", None) == 429 or "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
            logger.warning("Gemini quota exhausted (429) — stopping AI for this run: %s", title)
            raise QuotaExhausted(str(exc)) from exc
        logger.warning("Gemini client error for %s: %s", title, exc)
        return None
    except Exception:
        logger.exception("Gemini API call failed for: %s", title)
        return None


# ── Main ingestion runner ─────────────────────────────────────────────────────

def run_ingestion() -> None:
    """
    Full ingestion cycle. Called by APScheduler at 07:30 IST.
    Safe to call manually for testing.
    """
    from app.config import settings
    from app.db.database import SessionLocal
    from app.db.models import CurrentAffair, QuizQuestion

    db = SessionLocal()
    try:
        feed_urls = [u.strip() for u in settings.RSS_FEEDS.split(",") if u.strip()] or DEFAULT_RSS_FEEDS

        entries = _fetch_rss_entries(feed_urls)
        if not entries:
            logger.info("No RSS entries fetched — nothing to ingest.")
            return

        api_key: str = settings.GEMINI_API_KEY or ""
        use_ai = bool(api_key)
        gemini_model = settings.GEMINI_MODEL or CA_INGESTION_DEFAULT_GEMINI_MODEL
        ai_calls = 0

        if not use_ai:
            logger.info("GEMINI_API_KEY not set — saving fetched article text without AI processing.")
        else:
            logger.info(
                "Gemini ingestion: model=%s, max_ai_articles=%d, delay=%ds",
                gemini_model,
                CA_INGESTION_MAX_AI_ARTICLES,
                CA_INGESTION_GEMINI_DELAY_SEC,
            )

        saved = 0
        skipped = 0
        raw_fallback = 0
        today = date.today()

        for entry in entries:
            title = entry["title"]
            if not title:
                continue

            exists = (
                db.query(CurrentAffair)
                .filter(
                    CurrentAffair.title == title,
                    CurrentAffair.published_date == today,
                )
                .first()
            )
            if exists:
                skipped += 1
                continue

            full_text = _resolve_article_text(
                title,
                entry.get("description") or "",
                entry.get("url") or "",
            )

            ai_data: Optional[dict] = None

            if use_ai and ai_calls < CA_INGESTION_MAX_AI_ARTICLES:
                try:
                    if ai_calls > 0:
                        time.sleep(CA_INGESTION_GEMINI_DELAY_SEC)
                    ai_data = _process_with_gemini(
                        api_key, title, full_text, model=gemini_model
                    )
                    ai_calls += 1
                    if ai_data is None:
                        skipped += 1
                        continue
                except QuotaExhausted:
                    use_ai = False
                    logger.warning(
                        "Free-tier quota hit after %d AI calls — remaining items saved with fetched text.",
                        ai_calls,
                    )

            if not ai_data and api_key:
                raw_fallback += 1

            summary, detailed_notes = _build_affair_text(title, full_text, ai_data)

            if summary.strip().lower() == title.strip().lower() and not detailed_notes:
                logger.info("Skipping thin article (no body): %s", title[:80])
                skipped += 1
                continue

            affair = CurrentAffair(
                title=title,
                summary=summary,
                detailed_notes=detailed_notes,
                syllabus_links=ai_data.get("syllabus_links") if ai_data else None,
                source_url=entry["url"],
                source_name=entry["source"],
                gs_paper=ai_data.get("gs_paper") if ai_data else None,
                subject_tags=ai_data.get("subject_tags") if ai_data else None,
                published_date=today,
                is_published=False,
                language="en",
            )
            db.add(affair)
            db.flush()

            if ai_data and ai_data.get("quiz_question"):
                qd = ai_data["quiz_question"]
                if all(qd.get(f) for f in ("question_text", "option_a", "option_b", "option_c", "option_d", "correct_option")):
                    db.add(QuizQuestion(
                        subject=ai_data.get("gs_paper", "General"),
                        topic=title[:100],
                        difficulty=qd.get("difficulty", "medium"),
                        question_text=qd["question_text"],
                        option_a=qd["option_a"],
                        option_b=qd["option_b"],
                        option_c=qd["option_c"],
                        option_d=qd["option_d"],
                        correct_option=qd["correct_option"].upper(),
                        explanation=qd.get("explanation", ""),
                        source=entry["source"],
                        current_affair_id=affair.id,
                        language="en",
                        is_approved=False,
                    ))

            saved += 1

        db.commit()
        logger.info(
            "CA ingestion complete: %d saved, %d skipped (duplicate/irrelevant/thin), "
            "%d raw RSS fallbacks, %d Gemini calls.",
            saved, skipped, raw_fallback, ai_calls,
        )

    except Exception:
        logger.exception("run_ingestion failed")
        db.rollback()
    finally:
        db.close()
