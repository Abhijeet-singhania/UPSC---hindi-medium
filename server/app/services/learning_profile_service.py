"""
Learning profile service.

Derives a learner's profile from existing behavioral signals:
  - exam_stage / optional_subject (from User)
  - weak subjects (from MockTestAttempt subject stats)
  - activity levels (silent library, streak)
  - preferred language

Used by the recommendation and daily-plan endpoints.
"""
from __future__ import annotations

from collections import defaultdict

from sqlalchemy.orm import Session

from app.db.models import MockTestAttempt, User


def get_profile(db: Session, user: User) -> dict:
    """
    Return a dict of learner signals for personalisation:

    {
        "exam_stage": "mains",
        "optional_subject": "History",
        "preferred_language": "hi",
        "weak_subjects": ["Economy", "Environment"],
        "strong_subjects": ["Polity"],
        "activity_level": "high",   # low | medium | high
        "streak_days": 7,
    }
    """
    # Subject performance from mock tests
    attempts = (
        db.query(MockTestAttempt)
        .filter(MockTestAttempt.user_id == user.id)
        .order_by(MockTestAttempt.created_at.desc())
        .limit(20)  # last 20 tests
        .all()
    )

    weak_subjects: list[str] = []
    strong_subjects: list[str] = []

    if attempts:
        # Aggregate percentage by source (pyq = paper-wise, quiz = subject)
        # MockTestAttempt stores aggregate score but not per-subject breakdown.
        # We derive rough "weak" from low overall percentage on recent tests.
        recent_scores = [a.percentage for a in attempts if a.percentage is not None]
        avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 0

        # Tag attempts below 50% as weak-signal for their subject/paper filter
        # We don't have per-subject breakdown in mock_test_attempts, so we use
        # the attempt's source type and score as a proxy.
        low_attempts = [a for a in attempts if (a.percentage or 0) < 50]
        high_attempts = [a for a in attempts if (a.percentage or 0) >= 65]

        # Extract exam types from weak attempts to suggest study areas
        if low_attempts:
            weak_subjects = _infer_subjects_from_attempts(low_attempts)
        if high_attempts:
            strong_subjects = _infer_subjects_from_attempts(high_attempts)

    # Activity level from streak + recent sessions
    streak = user.streak_days or 0
    if streak >= 14:
        activity_level = "high"
    elif streak >= 5:
        activity_level = "medium"
    else:
        activity_level = "low"

    return {
        "exam_stage": user.exam_stage.value if user.exam_stage else "beginner",
        "optional_subject": user.optional_subject,
        "preferred_language": user.preferred_language or "hi",
        "weak_subjects": weak_subjects[:5],
        "strong_subjects": strong_subjects[:3],
        "activity_level": activity_level,
        "streak_days": streak,
    }


def _infer_subjects_from_attempts(attempts: list[MockTestAttempt]) -> list[str]:
    """
    Since mock_test_attempts doesn't store per-subject breakdown, we map
    exam_type + source to the most common weak UPSC subject areas.
    """
    subject_signals: dict[str, int] = defaultdict(int)
    for a in attempts:
        if a.source == "pyq":
            # Prelims PYQ weak = general studies weakness
            subject_signals["Current Affairs"] += 1
            subject_signals["Economy"] += 1
        elif a.source == "quiz-bank":
            subject_signals["Polity"] += 1
            subject_signals["Environment"] += 1
    return sorted(subject_signals, key=subject_signals.get, reverse=True)


# ── Recommendation builder ────────────────────────────────────────────────────

# Priority subjects by exam stage
_STAGE_SUBJECT_FOCUS = {
    "beginner": ["Polity", "History", "Geography", "Economy"],
    "prelims":  ["Current Affairs", "Economy", "Environment", "Science"],
    "mains":    ["GS2", "GS3", "Essay", "Ethics"],
    "interview": ["Current Affairs", "Ethics", "Optional subject"],
}


def build_recommendations(profile: dict, today_ca_subjects: list[str]) -> list[dict]:
    """
    Return a list of recommended study actions for the learner today.
    Each item: {"type": ..., "label": ..., "reason": ..., "route": ..., "priority": 1-5}
    """
    recs: list[dict] = []
    stage = profile.get("exam_stage", "beginner")
    weak = set(profile.get("weak_subjects", []))
    language = profile.get("preferred_language", "hi")
    optional = profile.get("optional_subject")
    activity = profile.get("activity_level", "medium")
    streak = profile.get("streak_days", 0)

    # 1. Always: today's answer writing
    recs.append({
        "type": "answer_writing",
        "label": "Daily Answer Writing",
        "reason": "Practice structured writing every day — it compounds over months.",
        "route": "/answers",
        "priority": 1,
    })

    # 2. If weak subjects detected → prelims practice on that subject
    if weak:
        weak_label = next(iter(weak))
        recs.append({
            "type": "prelims_weak",
            "label": f"Prelims MCQs: {weak_label}",
            "reason": f"Recent tests suggest {weak_label} needs reinforcement.",
            "route": f"/prelims?subject={weak_label}",
            "priority": 2,
        })
    else:
        # Default to stage-based focus
        focus = _STAGE_SUBJECT_FOCUS.get(stage, ["Current Affairs"])[0]
        recs.append({
            "type": "prelims_focus",
            "label": f"Prelims MCQs: {focus}",
            "reason": f"Core {stage.title()}-stage topic.",
            "route": f"/prelims?subject={focus}",
            "priority": 2,
        })

    # 3. Current affairs reading (prioritise subjects in today's CA if known)
    ca_subject = today_ca_subjects[0] if today_ca_subjects else "Current Affairs"
    recs.append({
        "type": "current_affairs",
        "label": f"Today's Current Affairs: {ca_subject}",
        "reason": "UPSC integrates CA with static topics — read daily.",
        "route": "/affairs",
        "priority": 3,
    })

    # 4. Ask AI — always useful for concept clearing
    recs.append({
        "type": "ask_ai",
        "label": "Ask AI Mentor",
        "reason": "Confused about a concept? Get a grounded explanation with sources.",
        "route": "/ask-ai",
        "priority": 4,
    })

    # 5. Silent library — reward high streaks, nudge low-activity users
    if activity == "low" or streak == 0:
        recs.append({
            "type": "wellbeing",
            "label": "Start a Silent Study Session",
            "reason": "Building a daily study habit is the biggest predictor of success.",
            "route": "/wellbeing",
            "priority": 5,
        })
    else:
        recs.append({
            "type": "community",
            "label": "Answer a Community Doubt",
            "reason": "Teaching others solidifies your own understanding.",
            "route": "/community",
            "priority": 5,
        })

    return recs


def build_daily_plan(profile: dict) -> list[dict]:
    """
    Return a structured daily study plan (time-blocked) based on exam stage.
    Each block: {"time": "7:00–8:00 AM", "activity": ..., "subject": ..., "route": ...}
    """
    stage = profile.get("exam_stage", "beginner")
    weak = profile.get("weak_subjects", [])

    plans = {
        "beginner": [
            {"time": "6:00–7:00 AM", "activity": "NCERT Reading", "subject": "History/Geography", "route": "/content"},
            {"time": "7:00–7:30 AM", "activity": "Current Affairs", "subject": "Today's digest", "route": "/affairs"},
            {"time": "8:00–9:00 AM", "activity": "Prelims MCQ Practice", "subject": "Polity", "route": "/prelims"},
            {"time": "Evening", "activity": "Answer Writing", "subject": "Any GS topic", "route": "/answers"},
        ],
        "prelims": [
            {"time": "6:00–7:00 AM", "activity": "Current Affairs + MCQs", "subject": "Today's CA", "route": "/affairs"},
            {"time": "7:00–9:00 AM", "activity": "Prelims Practice", "subject": weak[0] if weak else "Economy", "route": "/prelims"},
            {"time": "9:00–9:30 AM", "activity": "Quiz Bank", "subject": "Mixed subjects", "route": "/prelims"},
            {"time": "Evening", "activity": "Revision + Ask AI", "subject": "Unclear concepts", "route": "/ask-ai"},
        ],
        "mains": [
            {"time": "6:00–7:00 AM", "activity": "Current Affairs", "subject": "Editorial analysis", "route": "/affairs"},
            {"time": "7:00–9:00 AM", "activity": "Answer Writing", "subject": "GS2/GS3 alternating", "route": "/answers"},
            {"time": "9:00–10:00 AM", "activity": "Conceptual Reading", "subject": "Weekly syllabus topic", "route": "/content"},
            {"time": "Evening", "activity": "Ask AI + Community", "subject": "Peer learning", "route": "/community"},
        ],
        "interview": [
            {"time": "6:00–7:00 AM", "activity": "Current Affairs", "subject": "National + International", "route": "/affairs"},
            {"time": "7:00–8:00 AM", "activity": "Mock Interview Practice", "subject": "DAF-based questions", "route": "/ask-ai"},
            {"time": "Evening", "activity": "Community Discussion", "subject": "Opinion & analysis", "route": "/community"},
        ],
    }

    return plans.get(stage, plans["beginner"])
