"""
Scheduled background jobs.
All jobs run inside the FastAPI process via APScheduler (no separate worker needed).
Times are in Asia/Kolkata (IST) unless noted.
"""

import logging
from datetime import datetime, timezone, timedelta, date

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.database import SessionLocal
from app.db.models import SilentSession, DailyQuestion
from app.services.redis_service import redis_service, LEADERBOARD_KEYS
from app.services.ca_ingestion import run_ingestion
from app.services.indexing_service import backfill_all as _backfill_all

logger = logging.getLogger(__name__)

_scheduler = BackgroundScheduler(timezone="Asia/Kolkata")


# ── Job 1: expire stale silent-library sessions ──────────────────────────────

def expire_stale_sessions() -> None:
    """
    End any silent-library session that has been open for more than 8 hours.
    This handles users who closed the tab without clicking Leave.
    Runs every hour.
    """
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=8)
        stale = (
            db.query(SilentSession)
            .filter(
                SilentSession.end_time.is_(None),
                SilentSession.start_time <= cutoff,
            )
            .all()
        )
        for session in stale:
            session.end_time = datetime.now(timezone.utc)
            duration = (session.end_time - session.start_time).total_seconds() / 60
            session.duration_minutes = int(min(duration, 480))  # cap at 8 h
            try:
                from app.services.redis_service import redis_service
                redis_service.leave_active_room(session.user_id)
            except Exception:
                pass
            logger.info("Auto-expired stale session %s (user %s)", session.id, session.user_id)
        if stale:
            db.commit()
            logger.info("Expired %d stale silent-library sessions.", len(stale))
    except Exception:
        logger.exception("expire_stale_sessions job failed")
        db.rollback()
    finally:
        db.close()


# ── Job 2: reset daily study-time leaderboard ────────────────────────────────

def reset_daily_leaderboard() -> None:
    """Clear the daily study leaderboard at midnight IST. Runs daily at 00:05."""
    try:
        redis_service.client.delete(LEADERBOARD_KEYS["study_daily"])
        logger.info("Daily leaderboard reset at %s", datetime.now(timezone.utc).isoformat())
    except Exception:
        logger.exception("reset_daily_leaderboard job failed")


# ── Job 3: reset weekly study-time leaderboard ──────────────────────────────

def reset_weekly_leaderboard() -> None:
    """Clear the weekly study leaderboard every Monday at 00:10 IST."""
    try:
        redis_service.client.delete(LEADERBOARD_KEYS["study_weekly"])
        logger.info("Weekly leaderboard reset at %s", datetime.now(timezone.utc).isoformat())
    except Exception:
        logger.exception("reset_weekly_leaderboard job failed")


# ── Job 4: rotate daily answer-writing question ──────────────────────────────

def rotate_daily_question() -> None:
    """
    Each morning at 06:00 IST:
    - Mark the current active question inactive.
    - Activate the oldest un-activated question whose date <= today (IST).
    If no queued question exists, the previous one stays active — admins are notified
    in the log to create more questions.
    """
    import pytz
    from datetime import datetime as _dt

    tz_ist = pytz.timezone("Asia/Kolkata")
    today_ist = _dt.now(tz_ist).date()

    db = SessionLocal()
    try:
        # Deactivate all currently active questions
        db.query(DailyQuestion).filter(DailyQuestion.is_active == True).update(
            {DailyQuestion.is_active: False}
        )

        # Find the next queued question scheduled for today (IST) or earlier
        next_q = (
            db.query(DailyQuestion)
            .filter(
                DailyQuestion.is_active == False,
                DailyQuestion.date <= today_ist,
            )
            .order_by(DailyQuestion.date.asc(), DailyQuestion.id.asc())
            .first()
        )

        if next_q:
            next_q.is_active = True
            db.commit()
            logger.info("Daily question rotated → id=%s: %s", next_q.id, next_q.title)
        else:
            db.rollback()
            logger.warning(
                "No queued daily question found for %s (IST). "
                "Create a question in Admin with date ≤ today.",
                today_ist,
            )
    except Exception:
        logger.exception("rotate_daily_question job failed")
        db.rollback()
    finally:
        db.close()


# ── Job 5: nightly AI content reindex ────────────────────────────────────────

def nightly_reindex() -> None:
    """
    Re-index all platform content for the RAG/AI layer at 08:15 IST daily
    (after the 07:30 IST CA ingestion run, so newly-published articles are included).
    Skips chunks whose content hash hasn't changed — low cost on normal days.
    """
    try:
        logger.info("Nightly AI reindex starting…")
        _backfill_all(triggered_by="scheduler")
    except Exception:
        logger.exception("nightly_reindex job failed")


# ── Scheduler lifecycle ──────────────────────────────────────────────────────

def start_scheduler() -> None:
    """Register all jobs and start the scheduler. Call once at app startup."""
    _scheduler.add_job(
        expire_stale_sessions,
        CronTrigger(hour="*", minute=0),
        id="expire_stale_sessions",
        replace_existing=True,
        misfire_grace_time=300,
    )
    _scheduler.add_job(
        reset_daily_leaderboard,
        CronTrigger(hour=0, minute=5, timezone="Asia/Kolkata"),
        id="reset_daily_leaderboard",
        replace_existing=True,
        misfire_grace_time=300,
    )
    _scheduler.add_job(
        reset_weekly_leaderboard,
        CronTrigger(day_of_week="mon", hour=0, minute=10, timezone="Asia/Kolkata"),
        id="reset_weekly_leaderboard",
        replace_existing=True,
        misfire_grace_time=300,
    )
    _scheduler.add_job(
        rotate_daily_question,
        CronTrigger(hour=6, minute=0, timezone="Asia/Kolkata"),
        id="rotate_daily_question",
        replace_existing=True,
        misfire_grace_time=600,
    )
    _scheduler.add_job(
        run_ingestion,
        CronTrigger(hour=7, minute=30, timezone="Asia/Kolkata"),
        id="ingest_current_affairs",
        replace_existing=True,
        misfire_grace_time=900,
    )
    _scheduler.add_job(
        nightly_reindex,
        CronTrigger(hour=8, minute=15, timezone="Asia/Kolkata"),
        id="nightly_ai_reindex",
        replace_existing=True,
        misfire_grace_time=1800,
    )

    _scheduler.start()
    logger.info("APScheduler started with %d jobs.", len(_scheduler.get_jobs()))


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler. Call on app shutdown."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
