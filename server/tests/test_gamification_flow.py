"""
Integration tests for achievements, points, votes, mock tests, and gamification config.
"""

from datetime import datetime, timezone

from app.constants import (
    POINTS_PER_UPVOTE,
    POINTS_PER_ANSWER,
    POINTS_PER_QUESTION,
    POINTS_DAILY_SUBMISSION,
    POINTS_DOUBT_SOLVED,
    POINTS_BEST_ANSWER,
    FLAWLESS_MIN_QUESTIONS,
    LEVELS,
)
from app.db.models import (
    User,
    UserRole,
    Question,
    Answer,
    DailyQuestion,
    DailyAnswer,
    SilentSession,
    MockTestAttempt,
    ReputationLog,
)
from tests.conftest import auth_headers, login_token, register_user


class TestGamificationConfig:
    def test_config_exposes_levels_and_points(self, client):
        response = client.get("/api/v1/gamification/config")
        assert response.status_code == 200
        data = response.json()
        assert len(data["levels"]) == len(LEVELS)
        assert data["levels"][0]["rank"] == "Aspirant"
        assert data["points"]["upvote"] == POINTS_PER_UPVOTE
        assert data["flawless_min_questions"] == FLAWLESS_MIN_QUESTIONS


class TestVoteReputation:
    def test_upvote_grants_once_and_revoke_on_clear(self, client, user_pair, db):
        asker = db.query(User).filter(User.email == "asker@test.dev").first()
        helper = db.query(User).filter(User.email == "helper@test.dev").first()

        q = Question(title="Q", content="Body", user_id=asker.id)
        db.add(q)
        db.commit()
        db.refresh(q)

        create = client.post(
            "/api/v1/answers/",
            headers=auth_headers(user_pair["helper_token"]),
            json={"question_id": q.id, "content": "My answer"},
        )
        assert create.status_code == 200
        answer_id = create.json()["id"]

        db.refresh(helper)
        assert helper.reputation == POINTS_PER_ANSWER

        vote = client.post(
            f"/api/v1/answers/{answer_id}/vote?value=1",
            headers=auth_headers(user_pair["asker_token"]),
        )
        assert vote.status_code == 200
        db.refresh(helper)
        assert helper.reputation == POINTS_PER_ANSWER + POINTS_PER_UPVOTE

        # Repeat upvote must not stack XP
        client.post(
            f"/api/v1/answers/{answer_id}/vote?value=1",
            headers=auth_headers(user_pair["asker_token"]),
        )
        db.refresh(helper)
        assert helper.reputation == POINTS_PER_ANSWER + POINTS_PER_UPVOTE

        # Remove vote
        client.post(
            f"/api/v1/answers/{answer_id}/vote?value=0",
            headers=auth_headers(user_pair["asker_token"]),
        )
        db.refresh(helper)
        assert helper.reputation == POINTS_PER_ANSWER


class TestQuestionPoints:
    def test_posting_question_awards_points(self, client, user_pair, db):
        response = client.post(
            "/api/v1/questions/",
            headers=auth_headers(user_pair["asker_token"]),
            json={"title": "New doubt", "content": "Details here", "tags": []},
        )
        assert response.status_code == 200

        user = db.query(User).filter(User.email == "asker@test.dev").first()
        assert user.reputation == POINTS_PER_QUESTION

        logs = db.query(ReputationLog).filter(
            ReputationLog.user_id == user.id,
            ReputationLog.reason == "question",
        ).all()
        assert len(logs) == 1


class TestAcceptAnswerOnce:
    def test_doubt_solved_bonus_only_once(self, client, user_pair, db):
        asker = db.query(User).filter(User.email == "asker@test.dev").first()
        helper = db.query(User).filter(User.email == "helper@test.dev").first()

        q = Question(title="Q2", content="Body", user_id=asker.id)
        db.add(q)
        db.commit()
        db.refresh(q)

        create = client.post(
            "/api/v1/answers/",
            headers=auth_headers(user_pair["helper_token"]),
            json={"question_id": q.id, "content": "Solution"},
        )
        answer_id = create.json()["id"]

        for _ in range(2):
            resp = client.post(
                f"/api/v1/answers/{answer_id}/accept",
                headers=auth_headers(user_pair["asker_token"]),
            )
            assert resp.status_code == 200

        db.refresh(helper)
        base = POINTS_PER_ANSWER + POINTS_DOUBT_SOLVED
        assert helper.reputation == base


class TestDailyAnswerFlow:
    def test_daily_submission_vote_and_pin_once(self, client, user_pair, admin_user, db):
        helper = db.query(User).filter(User.email == "helper@test.dev").first()

        dq = DailyQuestion(title="Daily", content="Write", posted_by=admin_user["user"].id)
        db.add(dq)
        db.commit()
        db.refresh(dq)

        submit = client.post(
            "/api/v1/daily/answers/",
            headers=auth_headers(user_pair["helper_token"]),
            json={"daily_question_id": dq.id, "content": "My daily answer text here"},
        )
        assert submit.status_code == 200
        daily_id = submit.json()["id"]

        db.refresh(helper)
        assert helper.reputation == POINTS_DAILY_SUBMISSION

        asker_token = login_token(client, "asker@test.dev")
        client.post(
            f"/api/v1/daily/answers/{daily_id}/vote?value=1",
            headers=auth_headers(asker_token),
        )
        db.refresh(helper)
        assert helper.reputation == POINTS_DAILY_SUBMISSION + POINTS_PER_UPVOTE

        for _ in range(2):
            pin = client.post(
                f"/api/v1/daily/answers/{daily_id}/pin",
                headers=auth_headers(admin_user["token"]),
            )
            assert pin.status_code == 200

        db.refresh(helper)
        assert helper.reputation == (
            POINTS_DAILY_SUBMISSION + POINTS_PER_UPVOTE + POINTS_BEST_ANSWER
        )


class TestMockTestSubmit:
    def test_submit_awards_points_and_flawless_flag(self, client, db):
        register_user(client, "mock@test.dev")
        token = login_token(client, "mock@test.dev")

        payload = {
            "exam_type": "prelims",
            "source": "pyq",
            "total_questions": FLAWLESS_MIN_QUESTIONS,
            "correct_count": FLAWLESS_MIN_QUESTIONS,
            "wrong_count": 0,
            "unattempted_count": 0,
            "score": 100.0,
            "percentage": 100,
            "time_used_seconds": 3600,
        }
        response = client.post(
            "/api/v1/mock-tests/submit",
            headers=auth_headers(token),
            json=payload,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["points_awarded"] == 50
        assert body["flawless"] is True

        user = db.query(User).filter(User.email == "mock@test.dev").first()
        assert user.reputation == 50

        attempts = db.query(MockTestAttempt).filter(MockTestAttempt.user_id == user.id).all()
        assert len(attempts) == 1


class TestAchievementsEndpoint:
    def _achievements(self, client, token):
        response = client.get(
            "/api/v1/users/me/achievements",
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        return response.json()

    def test_first_blood_after_answer(self, client, user_pair, db):
        asker = db.query(User).filter(User.email == "asker@test.dev").first()
        q = Question(title="Q", content="C", user_id=asker.id)
        db.add(q)
        db.commit()
        db.refresh(q)

        client.post(
            "/api/v1/answers/",
            headers=auth_headers(user_pair["helper_token"]),
            json={"question_id": q.id, "content": "First"},
        )

        data = self._achievements(client, user_pair["helper_token"])
        assert data["first_blood"] is True
        assert data["flawless"] is False

    def test_scholar_and_cabinet_by_reputation(self, client, db):
        register_user(client, "rich@test.dev")
        token = login_token(client, "rich@test.dev")
        user = db.query(User).filter(User.email == "rich@test.dev").first()
        user.reputation = 1000
        db.commit()

        data = self._achievements(client, token)
        assert data["scholar"] is True
        assert data["cabinet"] is True

    def test_streak_30_badge(self, client, db):
        register_user(client, "streak@test.dev")
        token = login_token(client, "streak@test.dev")
        user = db.query(User).filter(User.email == "streak@test.dev").first()
        user.streak_days = 30
        db.commit()

        data = self._achievements(client, token)
        assert data["streak_30"] is True
        assert data["streak_progress"] == 30

    def test_night_owl_after_silent_session(self, client, db):
        register_user(client, "night@test.dev")
        token = login_token(client, "night@test.dev")
        user = db.query(User).filter(User.email == "night@test.dev").first()

        session = SilentSession(
            user_id=user.id,
            end_time=datetime.now(timezone.utc),
            duration_minutes=10,
        )
        db.add(session)
        db.commit()

        data = self._achievements(client, token)
        assert data["night_owl"] is True

    def test_flawless_after_perfect_mock(self, client, db):
        register_user(client, "perfect@test.dev")
        token = login_token(client, "perfect@test.dev")

        client.post(
            "/api/v1/mock-tests/submit",
            headers=auth_headers(token),
            json={
                "exam_type": "prelims",
                "source": "quiz-bank",
                "total_questions": FLAWLESS_MIN_QUESTIONS,
                "correct_count": FLAWLESS_MIN_QUESTIONS,
                "wrong_count": 0,
                "unattempted_count": 0,
                "score": 100.0,
                "percentage": 100,
                "time_used_seconds": 1200,
            },
        )

        data = self._achievements(client, token)
        assert data["flawless"] is True
        assert data["mock_tests_completed"] == 1

    def test_flawless_not_awarded_below_question_threshold(self, client, db):
        register_user(client, "small@test.dev")
        token = login_token(client, "small@test.dev")

        client.post(
            "/api/v1/mock-tests/submit",
            headers=auth_headers(token),
            json={
                "exam_type": "prelims",
                "source": "pyq",
                "total_questions": 10,
                "correct_count": 10,
                "wrong_count": 0,
                "unattempted_count": 0,
                "score": 20.0,
                "percentage": 100,
                "time_used_seconds": 600,
            },
        )

        data = self._achievements(client, token)
        assert data["flawless"] is False
        assert data["mock_tests_completed"] == 1
