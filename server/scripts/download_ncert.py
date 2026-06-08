#!/usr/bin/env python3
"""
Download NCERT books relevant for UPSC from ncert.nic.in (official government site).
All PDFs are freely available under government educational policy.

Usage:
    python server/scripts/download_ncert.py

Output:
    study_material/
        history/
            class_06_our_pasts_1.pdf
            class_12_themes_indian_history_1.pdf
            ...
        geography/
            ...
        polity/
            ...
        economy/
            ...
        science/
            ...
        sociology/
            ...

The script auto-detects chapter count (stops at first 404).
Chapters are merged into a single PDF per book using pypdf.
Re-running is safe — already downloaded books are skipped.
"""

import os
import sys
import time
import tempfile
import shutil
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

try:
    from pypdf import PdfWriter, PdfReader
    HAS_PYPDF = True
except ImportError:
    try:
        from PyPDF2 import PdfWriter, PdfReader
        HAS_PYPDF = True
    except ImportError:
        HAS_PYPDF = False
        print("WARNING: pypdf not installed. Chapters will be saved individually (not merged).")
        print("         Install with: pip install pypdf")

# ── Config ────────────────────────────────────────────────────────────────────

BASE_URL = "https://ncert.nic.in/textbook/pdf"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "study_material"
DELAY_BETWEEN_CHAPTERS = 1.0   # seconds — be polite to NCERT servers
DELAY_BETWEEN_BOOKS = 2.0
TIMEOUT = 30
MAX_CHAPTERS = 30              # safety cap per book

HEADERS = {
    "User-Agent": "Mozilla/5.0 (educational/research use) UPSC-Study-App",
}

# ── UPSC-Relevant NCERT Book Catalogue ───────────────────────────────────────
# Format: (code, output_filename_without_ext, subject_folder, description)
# Code pattern: {class_letter}{subject_code}{part}
#   class letters: f=6, g=7, h=8, i=9, j=10, k=11, l=12

BOOKS = [
    # ── HISTORY ───────────────────────────────────────────────────────────────
    ("fhss1", "class_06_our_pasts_1",                   "history", "Class 6  — Our Pasts Part I"),
    ("ghss1", "class_07_our_pasts_2",                   "history", "Class 7  — Our Pasts Part II"),
    ("hhss1", "class_08_our_pasts_3",                   "history", "Class 8  — Our Pasts Part III"),
    ("ihss1", "class_09_india_contemporary_world_1",    "history", "Class 9  — India & Contemporary World I"),
    ("jhss1", "class_10_india_contemporary_world_2",    "history", "Class 10 — India & Contemporary World II"),
    ("khis1", "class_11_themes_world_history",          "history", "Class 11 — Themes in World History"),
    ("lhis1", "class_12_themes_indian_history_1",       "history", "Class 12 — Themes in Indian History I"),
    ("lhis2", "class_12_themes_indian_history_2",       "history", "Class 12 — Themes in Indian History II"),
    ("lhis3", "class_12_themes_indian_history_3",       "history", "Class 12 — Themes in Indian History III"),

    # ── GEOGRAPHY ─────────────────────────────────────────────────────────────
    ("fgss1", "class_06_earth_our_habitat",             "geography", "Class 6  — The Earth Our Habitat"),
    ("ggss1", "class_07_our_environment",               "geography", "Class 7  — Our Environment"),
    ("hgss1", "class_08_resources_development",         "geography", "Class 8  — Resources and Development"),
    ("igss1", "class_09_contemporary_india_1",          "geography", "Class 9  — Contemporary India I"),
    ("jgss1", "class_10_contemporary_india_2",          "geography", "Class 10 — Contemporary India II"),
    ("kphy1", "class_11_physical_geography",            "geography", "Class 11 — Fundamentals of Physical Geography"),
    ("kpgy1", "class_11_india_physical_environment",    "geography", "Class 11 — India Physical Environment"),
    ("lhgy1", "class_12_human_geography",               "geography", "Class 12 — Human Geography (Fundamentals)"),
    ("lpgy1", "class_12_india_people_economy",          "geography", "Class 12 — India People and Economy"),

    # ── POLITICAL SCIENCE / POLITY ────────────────────────────────────────────
    ("keps1", "class_11_indian_constitution_at_work",   "polity", "Class 11 — Indian Constitution at Work"),
    ("keps2", "class_11_political_theory",              "polity", "Class 11 — Political Theory"),
    ("leps1", "class_12_contemporary_world_politics",   "polity", "Class 12 — Contemporary World Politics"),
    ("leps2", "class_12_politics_india_since_independence", "polity", "Class 12 — Politics in India since Independence"),

    # ── ECONOMICS ─────────────────────────────────────────────────────────────
    ("iecs1", "class_09_economics",                     "economy", "Class 9  — Economics"),
    ("jecs1", "class_10_understanding_economic_development", "economy", "Class 10 — Understanding Economic Development"),
    ("kegs1", "class_11_indian_economic_development",   "economy", "Class 11 — Indian Economic Development"),
    ("legs1", "class_12_macroeconomics",                "economy", "Class 12 — Introductory Macroeconomics"),
    ("legs2", "class_12_microeconomics",                "economy", "Class 12 — Introductory Microeconomics"),

    # ── SCIENCE (Env, Sci-Tech GS3) ───────────────────────────────────────────
    ("fess3", "class_06_science",                       "science", "Class 6  — Science"),
    ("gess3", "class_07_science",                       "science", "Class 7  — Science"),
    ("hess3", "class_08_science",                       "science", "Class 8  — Science"),
    ("iess3", "class_09_science",                       "science", "Class 9  — Science"),
    ("jess3", "class_10_science",                       "science", "Class 10 — Science"),

    # ── SOCIOLOGY (GS1 / Optional) ────────────────────────────────────────────
    ("ksoc1", "class_11_introducing_sociology",         "sociology", "Class 11 — Introducing Sociology"),
    ("ksoc2", "class_11_understanding_society",         "sociology", "Class 11 — Understanding Society"),
    ("lsoc1", "class_12_indian_society",                "sociology", "Class 12 — Indian Society"),
    ("lsoc2", "class_12_social_change_development",     "sociology", "Class 12 — Social Change and Development in India"),

    # ── ENVIRONMENT / ECOLOGY (GS3) ───────────────────────────────────────────
    ("iess2", "class_09_democratic_politics_1",         "polity", "Class 9  — Democratic Politics I"),
    ("jess2", "class_10_democratic_politics_2",         "polity", "Class 10 — Democratic Politics II"),
    ("iess1", "class_09_india_contemporary_world",      "history", "Class 9  — History (alt code)"),
]


# ── Download helpers ──────────────────────────────────────────────────────────

def chapter_url(code: str, chapter: int) -> str:
    return f"{BASE_URL}/{code}{chapter:02d}.pdf"


def download_chapter(code: str, chapter: int, dest: Path) -> bool:
    """Download one chapter PDF. Returns True if successful, False if 404/gone."""
    url = chapter_url(code, chapter)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True)
        if resp.status_code == 404:
            return False
        resp.raise_for_status()
        dest.write_bytes(resp.content)
        return True
    except requests.HTTPError as e:
        if "404" in str(e):
            return False
        print(f"    HTTP error on ch{chapter:02d}: {e}")
        return False
    except Exception as e:
        print(f"    Error on ch{chapter:02d}: {e}")
        return False


def merge_pdfs(chapter_files: list[Path], output: Path) -> bool:
    """Merge list of chapter PDFs into one file using pypdf."""
    if not HAS_PYPDF:
        return False
    try:
        writer = PdfWriter()
        for f in chapter_files:
            reader = PdfReader(str(f))
            for page in reader.pages:
                writer.add_page(page)
        with open(output, "wb") as out:
            writer.write(out)
        return True
    except Exception as e:
        print(f"    Merge error: {e}")
        return False


def download_book(code: str, filename: str, subject: str, description: str) -> bool:
    """
    Download all chapters of a book, merge into a single PDF.
    Returns True if at least one chapter was downloaded.
    """
    subject_dir = OUTPUT_DIR / subject
    subject_dir.mkdir(parents=True, exist_ok=True)

    final_pdf = subject_dir / f"{filename}.pdf"
    if final_pdf.exists():
        print(f"  SKIP (already downloaded): {description}")
        return True

    print(f"  Downloading: {description}  [{code}]")

    tmp_dir = Path(tempfile.mkdtemp(prefix="ncert_"))
    chapter_files: list[Path] = []

    try:
        for ch in range(1, MAX_CHAPTERS + 1):
            dest = tmp_dir / f"ch{ch:02d}.pdf"
            ok = download_chapter(code, ch, dest)
            if not ok:
                break  # no more chapters
            chapter_files.append(dest)
            print(f"    ch{ch:02d} ✓", end="\r", flush=True)
            time.sleep(DELAY_BETWEEN_CHAPTERS)

        if not chapter_files:
            print(f"    → No chapters found (code may be wrong, skipping)")
            return False

        print(f"    → {len(chapter_files)} chapter(s) downloaded")

        if HAS_PYPDF and len(chapter_files) > 1:
            ok = merge_pdfs(chapter_files, final_pdf)
            if ok:
                print(f"    → Merged into {final_pdf.name}")
            else:
                # fallback: copy first chapter only
                shutil.copy(chapter_files[0], final_pdf)
        elif len(chapter_files) == 1:
            shutil.copy(chapter_files[0], final_pdf)
        else:
            # No pypdf — save chapters individually
            for cf in chapter_files:
                dest = subject_dir / f"{filename}_{cf.name}"
                shutil.copy(cf, dest)
            print(f"    → Saved {len(chapter_files)} individual chapter files (install pypdf to merge)")

        return True

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("NCERT Downloader for UPSC")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Books to process: {len(BOOKS)}")
    print(f"PDF merging: {'enabled (pypdf)' if HAS_PYPDF else 'disabled — install pypdf'}")
    print("=" * 60)

    results = {"ok": 0, "skipped": 0, "failed": 0}

    for code, filename, subject, description in BOOKS:
        ok = download_book(code, filename, subject, description)
        if ok:
            if (OUTPUT_DIR / subject / f"{filename}.pdf").exists():
                results["ok"] += 1
            else:
                results["skipped"] += 1
        else:
            results["failed"] += 1
        time.sleep(DELAY_BETWEEN_BOOKS)

    print("\n" + "=" * 60)
    print(f"Done! Downloaded: {results['ok']}  Skipped (existed): {results['skipped']}  Failed: {results['failed']}")
    print(f"\nAll files saved to: {OUTPUT_DIR.resolve()}")
    print("\nNext step: Upload them via Admin → Study Materials tab")
    print("=" * 60)


if __name__ == "__main__":
    main()
