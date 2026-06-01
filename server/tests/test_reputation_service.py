"""Unit tests for reputation_service helpers."""

from app.constants import (
    POINTS_PER_UPVOTE,
    POINTS_DOUBT_SOLVED,
    POINTS_BEST_ANSWER,
    LEVELS,
)
from app.db.models import User, ReputationLog
from app.services.reputation_service import (
    apply_upvote_reputation,
    award_once,
    add_reputation,
    get_level,
)


def _make_user(db, email="u@test.dev", reputation=0):
    user = User(email=email, hashed_password="x", name="U", reputation=reputation)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class TestApplyUpvoteReputation:
    def test_grants_points_only_on_transition_to_upvote(self, db):
        author = _make_user(db)
        apply_upvote_reputation(db, author, 0, 1, "answer", 1)
        db.commit()
        db.refresh(author)
        assert author.reputation == POINTS_PER_UPVOTE

    def test_no_double_grant_when_already_upvoted(self, db):
        author = _make_user(db)
        apply_upvote_reputation(db, author, 1, 1, "answer", 1)
        db.commit()
        db.refresh(author)
        assert author.reputation == 0

    def test_revokes_on_upvote_removed(self, db):
        author = _make_user(db, reputation=POINTS_PER_UPVOTE)
        apply_upvote_reputation(db, author, 1, 0, "answer", 1)
        db.commit()
        db.refresh(author)
        assert author.reputation == 0

    def test_switch_down_to_up_grants_once(self, db):
        author = _make_user(db)
        apply_upvote_reputation(db, author, -1, 1, "answer", 1)
        db.commit()
        db.refresh(author)
        assert author.reputation == POINTS_PER_UPVOTE


class TestAwardOnce:
    def test_awards_first_time_only(self, db):
        user = _make_user(db)
        assert award_once(db, user, POINTS_DOUBT_SOLVED, "doubt_solved", "answer", 9)
        assert award_once(db, user, POINTS_DOUBT_SOLVED, "doubt_solved", "answer", 9) is False
        db.commit()
        db.refresh(user)
        assert user.reputation == POINTS_DOUBT_SOLVED

        logs = db.query(ReputationLog).filter(ReputationLog.user_id == user.id).all()
        assert len(logs) == 1


class TestGetLevel:
    def test_beginner_at_zero(self):
        info = get_level(0)
        assert info["level"] == "Beginner"
        assert info["rank"] == "Aspirant"

    def test_mentor_at_1000(self):
        info = get_level(1000)
        assert info["level"] == "Mentor"
        assert info["next_level"] is None

    def test_levels_match_constants(self):
        assert len(LEVELS) == 5
        assert LEVELS[-1]["min_points"] == 1000
