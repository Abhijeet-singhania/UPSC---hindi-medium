#!/usr/bin/env python3
"""
Wipe all sample/demo CONTENT from the database, keeping user accounts intact.

Usage:
    python wipe_content.py           # dry run — shows what would be deleted
    python wipe_content.py --confirm # actually deletes content
    python wipe_content.py --confirm --include-sessions  # also wipe silent library sessions
    python wipe_content.py --confirm --keep-pyq          # preserve PYQ data

What is deleted:
    current_affairs, quiz_questions, past_year_problems,
    daily_answers, daily_questions, community answers, community questions,
    question_tags, votes, mock_test_attempts, reputation_logs
    Optionally: silent_sessions, silent_streaks

User reputation, streak_days, and silent_sessions are ALWAYS reset so that
the leaderboard and badges start clean alongside the content.

What is KEPT:
    users table rows (email, password, role, name)
    Redis leaderboards are also cleared

After running:
    docker compose restart api
"""

from __future__ import annotations

import argparse
import sys

if __name__ == "__main__":
    sys.path.insert(0, ".")

from sqlalchemy import text
from app.db.database import SessionLocal, engine
from app.db import models  # noqa: F401  register all models


def wipe(confirm: bool, include_sessions: bool, keep_pyq: bool) -> None:
    db = SessionLocal()
    try:
        counts = {}

        tables_ordered = [
            # dependent first
            "votes",
            "mock_test_attempts",
            "reputation_logs",
            "daily_answers",
            "daily_questions",
            "answers",
            "question_tags",
            "questions",
            "quiz_questions",
            "current_affairs",
        ]
        if not keep_pyq:
            tables_ordered.append("past_year_problems")
        # silent sessions are always wiped (they carry badge state)
        tables_ordered += ["silent_streaks", "silent_sessions"]
        if include_sessions:
            pass  # already included above; flag kept for backward compat

        for table in tables_ordered:
            row = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            counts[table] = row

        print("\nContent to be wiped:")
        print("-" * 45)
        total = 0
        for table, count in counts.items():
            print(f"  {table:<30} {count:>6} rows")
            total += count
        print("-" * 45)
        print(f"  {'TOTAL':<30} {total:>6} rows")

        users = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
        print(f"\n  users (KEPT, not touched)      {users:>6} accounts")

        if keep_pyq:
            pyq_count = db.execute(text("SELECT COUNT(*) FROM past_year_problems")).scalar()
            print(f"\n  past_year_problems (KEPT via --keep-pyq) {pyq_count:>6} rows")

        if not confirm:
            print("\nDry run — no changes made. Use --confirm to wipe.")
            return

        print("\nWiping content…")
        for table in tables_ordered:
            db.execute(text(f"DELETE FROM {table}"))
            print(f"  Cleared {table}")

        # Reset user reputation and streaks so leaderboard + badges start clean
        db.execute(text("UPDATE users SET reputation = 0, streak_days = 0"))
        print("  Reset user reputation and streaks to 0")

        db.commit()
        print("\nAll content wiped. User accounts are intact (credentials kept, stats reset).")

        # Clear Redis leaderboards
        try:
            from app.services.redis_service import redis_service, LEADERBOARD_KEYS
            for key in LEADERBOARD_KEYS.values():
                redis_service.redis.delete(key)
            print("Redis leaderboards cleared.")
        except Exception as exc:
            print(f"Redis clear skipped: {exc}")

        print("\nDone. Restart the API container: docker compose restart api")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Wipe sample content, keep user accounts."
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Actually delete content (default is dry run)",
    )
    parser.add_argument(
        "--include-sessions",
        action="store_true",
        help="Also delete silent library sessions and streaks",
    )
    parser.add_argument(
        "--keep-pyq",
        action="store_true",
        help="Do NOT delete past_year_problems (default: also wipes PYQs)",
    )
    args = parser.parse_args()
    wipe(confirm=args.confirm, include_sessions=args.include_sessions, keep_pyq=args.keep_pyq)
