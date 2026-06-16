"""
Parse UPSC past-year question papers from PDF or plain text.

Strategy:
  1. Extract raw text (pdfplumber / UTF-8)
  2. Try regex split for numbered MCQs (Prelims)
  3. Optionally refine / recover with Gemini JSON extraction
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

_MAX_GEMINI_CHARS = 28_000
_OPTION_LINE = re.compile(
    r"^\s*[\(\[]?\s*([a-dA-D])\s*[\)\].:\-]\s*(.+)$",
    re.MULTILINE,
)
_Q_START = re.compile(
    r"(?:^|\n)\s*(?:"
    r"(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[\.\):\-]"
    r"|"
    r"(?:Q(?:uestion)?\.?\s*)(\d{1,3})\s*$"
    r")",
    re.MULTILINE | re.IGNORECASE,
)


def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        import pdfplumber
        pages = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                if t.strip():
                    pages.append(t)
        return "\n\n".join(pages)
    if ext in (".txt", ".md"):
        with open(file_path, encoding="utf-8", errors="ignore") as f:
            return f.read()
    raise ValueError(f"Unsupported file type '{ext}'. Use PDF or .txt.")


def _clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_question_blocks(text: str) -> list[tuple[str, str]]:
    """Return list of (question_number, block_text)."""
    matches = list(_Q_START.finditer(text))
    if len(matches) < 2:
        return []

    blocks: list[tuple[str, str]] = []
    for i, m in enumerate(matches):
        qnum = m.group(1) or m.group(2) or str(i + 1)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end].strip()
        if len(block) > 20:
            blocks.append((qnum, block))
    return blocks


def _parse_options(block: str) -> tuple[str, dict[str, str]]:
    """Split question stem from (a)-(d) options."""
    lines = block.split("\n")
    stem_lines: list[str] = []
    options: dict[str, str] = {}
    current_key: Optional[str] = None
    current_parts: list[str] = []

    def flush_option() -> None:
        nonlocal current_key, current_parts
        if current_key and current_parts:
            options[current_key] = " ".join(current_parts).strip()
        current_key = None
        current_parts = []

    for line in lines:
        m = _OPTION_LINE.match(line.strip())
        if m:
            flush_option()
            current_key = m.group(1).upper()
            current_parts = [m.group(2).strip()]
        elif current_key:
            if line.strip():
                current_parts.append(line.strip())
        else:
            stem_lines.append(line)

    flush_option()
    stem = "\n".join(stem_lines).strip()
    # If no option lines found, try inline (a) ... (b) ...
    if not options:
        inline = re.findall(
            r"\(([a-dA-D])\)\s*([^\(]+?)(?=\s*\([a-dA-D]\)|$)",
            block,
            flags=re.DOTALL,
        )
        if inline:
            stem = _OPTION_LINE.sub("", block)
            stem = re.sub(r"\([a-dA-D]\).*", "", block, flags=re.DOTALL).strip()
            for letter, opt_text in inline:
                options[letter.upper()] = opt_text.strip()
            # Re-derive stem: everything before first option
            first_opt = re.search(r"\([a-dA-D]\)", block)
            if first_opt:
                stem = block[: first_opt.start()].strip()

    return stem, options


def _regex_parse_prelims(
    text: str,
    *,
    default_subject: Optional[str] = None,
) -> list[dict]:
    text = _clean_text(text)
    blocks = _split_question_blocks(text)
    questions: list[dict] = []

    for qnum, block in blocks:
        stem, options = _parse_options(block)
        if not stem or len(stem) < 15:
            continue
        if len(options) < 2:
            continue

        questions.append({
            "question_number": f"Q.{qnum}",
            "question_text": stem,
            "option_a": options.get("A"),
            "option_b": options.get("B"),
            "option_c": options.get("C"),
            "option_d": options.get("D"),
            "correct_option": None,
            "explanation": None,
            "subject": default_subject,
            "topic": None,
            "marks": None,
            "word_limit": None,
        })

    return questions


def _regex_parse_mains(
    text: str,
    *,
    default_subject: Optional[str] = None,
) -> list[dict]:
    text = _clean_text(text)
    blocks = _split_question_blocks(text)
    questions: list[dict] = []

    for qnum, block in blocks:
        block = block.strip()
        if len(block) < 30:
            continue

        marks = None
        word_limit = None
        m_marks = re.search(r"(\d{1,3})\s*marks?", block, re.I)
        if m_marks:
            marks = int(m_marks.group(1))
        m_words = re.search(r"(\d{2,4})\s*words?", block, re.I)
        if m_words:
            word_limit = int(m_words.group(1))

        # Remove instruction line from stem if present
        stem = re.sub(r"^\(.*?\)\s*", "", block, count=1).strip()

        questions.append({
            "question_number": f"Q.{qnum}",
            "question_text": stem,
            "option_a": None,
            "option_b": None,
            "option_c": None,
            "option_d": None,
            "correct_option": None,
            "explanation": None,
            "subject": default_subject,
            "topic": None,
            "marks": marks,
            "word_limit": word_limit,
        })

    return questions


_GEMINI_PYQ_PROMPT = """You extract UPSC past-year exam questions from raw OCR/text.

Return JSON only — an array of question objects:
[
  {
    "question_number": "Q.1",
    "question_text": "full question stem",
    "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
    "correct_option": "A",
    "explanation": null,
    "subject": "Polity",
    "topic": "Parliament",
    "marks": null,
    "word_limit": null
  }
]

Rules:
- exam_type prelims: always include four options when present in source
- exam_type mains: options null; include marks/word_limit if stated
- correct_option only if explicitly given in source (else null)
- Do not invent questions — only extract what is in the text
- Preserve Hindi/Devanagari if the source is Hindi
"""


def _parse_json_array(raw: str) -> list[dict]:
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```", 1)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.split("```", 1)[0]
    data = json.loads(text.strip())
    if isinstance(data, dict) and "questions" in data:
        return data["questions"]
    if isinstance(data, list):
        return data
    raise ValueError("Expected JSON array of questions")


def _gemini_parse(
    text: str,
    *,
    exam_type: str,
    year: int,
    paper: Optional[str],
    language: str,
    default_subject: Optional[str],
) -> list[dict]:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set — enable AI parsing or use regex-only mode.")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    excerpt = text[:_MAX_GEMINI_CHARS]
    user_prompt = (
        f"exam_type: {exam_type}\n"
        f"year: {year}\n"
        f"paper: {paper or 'CSE'}\n"
        f"language: {language}\n"
        f"default_subject: {default_subject or 'infer from content'}\n\n"
        f"Source text:\n{excerpt}"
    )

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=_GEMINI_PYQ_PROMPT,
            temperature=0.2,
            max_output_tokens=8192,
            response_mime_type="application/json",
        ),
    )

    raw = (response.text or "").strip()
    items = _parse_json_array(raw)

    for item in items:
        if not item.get("subject") and default_subject:
            item["subject"] = default_subject
        co = item.get("correct_option")
        if co:
            item["correct_option"] = str(co).upper()[:1]

    return items


def parse_pyq_document(
    raw_text: str,
    *,
    exam_type: str,
    year: int,
    paper: Optional[str] = None,
    language: str = "hi",
    default_subject: Optional[str] = None,
    use_ai: bool = False,
) -> dict:
    """
    Parse document text into question dicts.
    Returns {parser, questions, warnings}.
    """
    warnings: list[str] = []
    text = _clean_text(raw_text)

    if not text:
        return {"parser": "none", "questions": [], "warnings": ["No text extracted."]}

    if exam_type == "mains":
        questions = _regex_parse_mains(text, default_subject=default_subject)
    else:
        questions = _regex_parse_prelims(text, default_subject=default_subject)

    parser = "regex"

    if use_ai or len(questions) < 3:
        if use_ai:
            warnings.append("AI parsing enabled.")
        else:
            warnings.append(f"Regex found only {len(questions)} questions — trying AI fallback.")
        try:
            ai_questions = _gemini_parse(
                text,
                exam_type=exam_type,
                year=year,
                paper=paper,
                language=language,
                default_subject=default_subject,
            )
            if len(ai_questions) >= len(questions):
                questions = ai_questions
                parser = "gemini"
        except Exception as exc:
            warnings.append(f"AI parse failed: {exc}")
            if not questions:
                raise

    # Attach metadata defaults
    for q in questions:
        q.setdefault("subject", default_subject)
        q.setdefault("language", language)

    return {
        "parser": parser,
        "questions": questions,
        "warnings": warnings,
        "char_count": len(text),
    }


def save_parsed_questions(
    db,
    questions: list[dict],
    *,
    year: int,
    exam_type: str,
    paper: Optional[str],
    language: str,
    created_by: int,
) -> dict:
    """Bulk insert parsed PYQs. Returns counts."""
    from app.db.models import PastYearProblem, PastYearExamType

    exam_enum = PastYearExamType(exam_type)
    saved = 0
    skipped = 0
    ids: list[int] = []

    for q in questions:
        qtext = (q.get("question_text") or "").strip()
        if not qtext:
            skipped += 1
            continue

        qnum = q.get("question_number")
        existing = (
            db.query(PastYearProblem)
            .filter(
                PastYearProblem.year == year,
                PastYearProblem.exam_type == exam_enum,
                PastYearProblem.question_number == qnum,
                PastYearProblem.question_text == qtext,
            )
            .first()
        )
        if existing:
            skipped += 1
            continue

        co = q.get("correct_option")
        row = PastYearProblem(
            year=year,
            exam_type=exam_enum,
            paper=paper or q.get("paper"),
            subject=q.get("subject"),
            topic=q.get("topic"),
            question_number=qnum,
            marks=q.get("marks"),
            word_limit=q.get("word_limit"),
            question_text=qtext,
            option_a=q.get("option_a"),
            option_b=q.get("option_b"),
            option_c=q.get("option_c"),
            option_d=q.get("option_d"),
            correct_option=co.upper() if co else None,
            explanation=q.get("explanation"),
            language=q.get("language") or language,
            created_by=created_by,
        )
        db.add(row)
        db.flush()
        ids.append(row.id)
        saved += 1

    db.commit()

    return {"saved": saved, "skipped": skipped, "ids": ids}
