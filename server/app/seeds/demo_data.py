"""
Demo users and sample content for local testing.

Triggered when SEED_DEMO_DATA=1 (see docker-compose) and admin@demo.drishti.dev
does not exist yet. Also used by seed_demo_data.py CLI.
"""

from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import (
    Answer,
    CurrentAffair,
    DailyAnswer,
    DailyQuestion,
    ExamStage,
    PastYearExamType,
    PastYearProblem,
    Question,
    QuestionTag,
    QuizQuestion,
    ReputationLog,
    Report,
    SilentSession,
    Tag,
    User,
    UserRole,
    Vote,
)
from app.services.auth_service import get_password_hash

DEMO_EMAIL_DOMAIN = "@demo.drishti.dev"
DEMO_PASSWORD = "Demo123!"


def demo_emails() -> tuple[str, ...]:
    return (
        f"admin{DEMO_EMAIL_DOMAIN}",
        f"priya{DEMO_EMAIL_DOMAIN}",
        f"rahul{DEMO_EMAIL_DOMAIN}",
    )


def admin_demo_email() -> str:
    return f"admin{DEMO_EMAIL_DOMAIN}"


def _clear_demo_users(db: Session) -> None:
    users = db.query(User).filter(User.email.endswith(DEMO_EMAIL_DOMAIN)).all()
    if not users:
        return
    ids = [u.id for u in users]

    q_ids = [q.id for q in db.query(Question).filter(Question.user_id.in_(ids)).all()]
    aids_on_demo_questions = (
        [a.id for a in db.query(Answer).filter(Answer.question_id.in_(q_ids)).all()] if q_ids else []
    )
    aids_by_demo = [a.id for a in db.query(Answer).filter(Answer.user_id.in_(ids)).all()]
    all_aids = list({*aids_on_demo_questions, *aids_by_demo})

    if all_aids:
        db.query(Vote).filter(Vote.target_type == "answer", Vote.target_id.in_(all_aids)).delete(
            synchronize_session=False
        )
    db.query(Vote).filter(Vote.user_id.in_(ids)).delete(synchronize_session=False)

    if q_ids:
        db.query(Answer).filter(Answer.question_id.in_(q_ids)).delete(synchronize_session=False)
        db.query(QuestionTag).filter(QuestionTag.question_id.in_(q_ids)).delete(synchronize_session=False)
        db.query(Question).filter(Question.id.in_(q_ids)).delete(synchronize_session=False)

    db.query(Answer).filter(Answer.user_id.in_(ids)).delete(synchronize_session=False)

    dq_ids = [d.id for d in db.query(DailyQuestion).filter(DailyQuestion.posted_by.in_(ids)).all()]
    if dq_ids:
        db.query(DailyAnswer).filter(DailyAnswer.daily_question_id.in_(dq_ids)).delete(synchronize_session=False)
        db.query(DailyQuestion).filter(DailyQuestion.id.in_(dq_ids)).delete(synchronize_session=False)

    db.query(DailyAnswer).filter(DailyAnswer.user_id.in_(ids)).delete(synchronize_session=False)
    db.query(ReputationLog).filter(ReputationLog.user_id.in_(ids)).delete(synchronize_session=False)
    db.query(SilentSession).filter(SilentSession.user_id.in_(ids)).delete(synchronize_session=False)
    db.query(Report).filter(Report.reporter_id.in_(ids)).delete(synchronize_session=False)
    db.query(PastYearProblem).filter(PastYearProblem.created_by.in_(ids)).delete(synchronize_session=False)

    db.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
    db.commit()


def _sync_redis_leaderboard(db: Session, user_ids: list[int]) -> None:
    try:
        from sqlalchemy import func

        from app.services.redis_service import LEADERBOARD_KEYS, redis_service

        key = LEADERBOARD_KEYS["reputation"]
        redis_service.redis.delete(key)
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        for u in sorted(users, key=lambda x: -x.reputation):
            redis_service.update_leaderboard(key, u.id, u.reputation)

        study_key = LEADERBOARD_KEYS["study_alltime"]
        redis_service.redis.delete(study_key)
        for uid in user_ids:
            total = (
                db.query(func.coalesce(func.sum(SilentSession.duration_minutes), 0))
                .filter(SilentSession.user_id == uid)
                .scalar()
                or 0
            )
            if int(total) > 0:
                redis_service.update_leaderboard(study_key, uid, int(total))
    except Exception as exc:  # noqa: BLE001
        print(f"  (Redis leaderboard sync skipped: {exc})")


def seed_demo_data(db: Session) -> None:
    pwd = get_password_hash(DEMO_PASSWORD)

    admin = User(
        email=admin_demo_email(),
        hashed_password=pwd,
        name="Demo Admin",
        device_id="demo-device-admin",
        bio="Seeded admin account for daily questions and moderation.",
        exam_stage=ExamStage.MAINS,
        optional_subject="PSIR",
        role=UserRole.ADMIN,
        preferred_language="hi",
        reputation=1240,
        streak_days=18,
        last_study_date=date.today(),
    )
    priya = User(
        email=f"priya{DEMO_EMAIL_DOMAIN}",
        hashed_password=pwd,
        name="Priya Sharma",
        device_id="demo-device-priya",
        bio="GS2 & Polity focus. Attempt 2.",
        exam_stage=ExamStage.PRELIMS,
        optional_subject="Sociology",
        role=UserRole.CONTRIBUTOR,
        preferred_language="hi",
        reputation=620,
        streak_days=11,
        last_study_date=date.today() - timedelta(days=1),
    )
    rahul = User(
        email=f"rahul{DEMO_EMAIL_DOMAIN}",
        hashed_password=pwd,
        name="Rahul Verma",
        device_id="demo-device-rahul",
        bio="Economy weak area — practising PYQs daily.",
        exam_stage=ExamStage.BEGINNER,
        role=UserRole.USER,
        preferred_language="en",
        reputation=195,
        streak_days=5,
        last_study_date=date.today() - timedelta(days=2),
    )
    db.add_all([admin, priya, rahul])
    db.flush()

    now = datetime.now(timezone.utc)
    for uid, blocks in [
        (admin.id, [(90, 3), (75, 6), (60, 8), (45, 10), (120, 14)]),
        (priya.id, [(45, 2), (60, 5), (30, 1), (50, 7), (40, 9), (60, 12)]),
        (rahul.id, [(25, 1), (30, 4), (20, 6)]),
    ]:
        for mins, days_ago in blocks:
            db.add(
                SilentSession(
                    user_id=uid,
                    start_time=now - timedelta(days=days_ago, hours=2),
                    end_time=now - timedelta(days=days_ago, hours=2) + timedelta(minutes=mins),
                    duration_minutes=mins,
                )
            )

    tag_names = ["GS2", "Polity", "Economy", "GS3", "Environment", "History"]
    tags: dict[str, Tag] = {}
    for name in tag_names:
        t = db.query(Tag).filter(Tag.name == name).first()
        if not t:
            t = Tag(name=name)
            db.add(t)
            db.flush()
        tags[name] = t

    q1 = Question(
        title="What is the difference between a Money Bill and a Finance Bill?",
        content="Specifically in context of Rajya Sabha powers and Article 110. How does certification by Speaker work?",
        user_id=priya.id,
        is_anonymous=False,
        is_solved=False,
        upvotes=8,
        downvotes=0,
    )
    q2 = Question(
        title="How to structure a 15-mark GS3 Economy answer in ~250 words?",
        content="Looking for a simple framework: intro, body, way forward — with PYQ linkage.",
        user_id=rahul.id,
        is_anonymous=False,
        is_solved=True,
        upvotes=15,
        downvotes=1,
    )
    db.add_all([q1, q2])
    db.flush()

    for q, tlist in [(q1, ["GS2", "Polity"]), (q2, ["GS3", "Economy"])]:
        for tn in tlist:
            db.add(QuestionTag(question_id=q.id, tag_id=tags[tn].id))

    a1 = Answer(
        content=(
            "A Money Bill is defined strictly under Article 110 and only Lok Sabha has decisive power; "
            "Rajya Sabha cannot reject it. A Finance Bill (Part of Union Budget) can be a Money Bill or not — "
            "if certified as Money Bill by Speaker, same procedure applies. The Speaker's certificate is final but not immune from judicial review in exceptional cases."
        ),
        question_id=q1.id,
        user_id=admin.id,
        is_accepted=False,
        upvotes=12,
        downvotes=0,
    )
    a2 = Answer(
        content=(
            "Quick framework: 1) One-line context. 2) 2–3 dimensions with examples/data. 3) "
            "Challenges/limitations. 4) Way forward + conclusion. Keep one diagram or mini-table if time permits."
        ),
        question_id=q2.id,
        user_id=priya.id,
        is_accepted=True,
        upvotes=20,
        downvotes=0,
    )
    a3 = Answer(
        content="Add definitions from NCERT/Economic Survey for keywords like 'inflation targeting', 'fiscal consolidation' to lift marks.",
        question_id=q2.id,
        user_id=admin.id,
        is_accepted=False,
        upvotes=4,
        downvotes=0,
    )
    db.add_all([a1, a2, a3])
    db.flush()
    q2.is_solved = True

    db.add(Vote(user_id=rahul.id, target_type="answer", target_id=a1.id, value=1))
    db.add(Vote(user_id=priya.id, target_type="answer", target_id=a1.id, value=1))

    dq = DailyQuestion(
        title="Federalism and cooperative federalism in India (15 marks)",
        content=(
            "Critically examine the role of NITI Aayog and Finance Commission in strengthening cooperative federalism. "
            "Suggest measures to address regional imbalances."
        ),
        subject="GS2",
        word_limit=250,
        marks=15,
        model_answer=(
            "Introduction: Define federalism and cooperative federalism. Body: Contrast Planning Commission vs NITI Aayog; "
            "FC's vertical/horizontal devolution; issues (centrism, delayed transfers, GST compensation). "
            "Conclusion: Capacity building, local bodies, predictable transfers."
        ),
        is_active=True,
        posted_by=admin.id,
        date=now,
    )
    db.add(dq)
    db.flush()

    db.add(
        DailyAnswer(
            daily_question_id=dq.id,
            user_id=priya.id,
            content=(
                "Cooperative federalism requires both policy coordination and fair resource sharing. NITI Aayog provides "
                "a platform for dialogue but lacks financial teeth compared to the old Planning Commission..."
            ),
            word_count=118,
            upvotes=6,
            is_best_answer=False,
            is_pinned=False,
        )
    )
    db.add(
        DailyAnswer(
            daily_question_id=dq.id,
            user_id=rahul.id,
            content=(
                "Finance Commission recommendations reduce friction by a rules-based formula. "
                "Still, GST Council politics shows asymmetry between large and small states..."
            ),
            word_count=86,
            upvotes=3,
            is_best_answer=False,
            is_pinned=False,
        )
    )

    extra_pyq = [
        # ── History ──────────────────────────────────────────────────────────────
        PastYearProblem(
            year=2024, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="History", topic="Modern India", question_number="Q.5",
            question_text="With reference to the Indian National Movement, consider the following statements:\n"
                          "1. The Lucknow Pact of 1916 was a milestone for Hindu-Muslim unity.\n"
                          "2. Annie Besant launched the Home Rule League in 1916.",
            option_a="1 only", option_b="2 only",
            option_c="Both 1 and 2", option_d="Neither 1 nor 2",
            correct_option="C",
            explanation="Both statements are correct. The Lucknow Pact (1916) brought Congress and Muslim League together. Besant launched the Home Rule League the same year.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2023, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="History", topic="Ancient India", question_number="Q.9",
            question_text="The term 'Dharmashastra' in ancient India primarily referred to:",
            option_a="Texts on statecraft and diplomacy",
            option_b="Sacred texts dealing with religious and legal duties",
            option_c="Astronomical and mathematical treatises",
            option_d="Epic poetry glorifying kings",
            correct_option="B",
            explanation="Dharmashastra refers to a genre of Sanskrit texts dealing with dharma—religious law, ethics, and the duties of individuals in society (e.g., Manusmriti).",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2022, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="History", topic="Medieval India", question_number="Q.14",
            question_text="Which Mughal emperor introduced the Mansabdari system in a comprehensive form?",
            option_a="Babur", option_b="Humayun", option_c="Akbar", option_d="Aurangzeb",
            correct_option="C",
            explanation="Akbar systematised the Mansabdari system which assigned ranks (mansabs) to military and civil officials, standardising hierarchy in the Mughal administration.",
            language="en", created_by=admin.id,
        ),
        # ── Geography ────────────────────────────────────────────────────────────
        PastYearProblem(
            year=2023, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Geography", topic="Climatology", question_number="Q.18",
            question_text="Which of the following correctly explains 'El Niño'?",
            option_a="Cooling of eastern Pacific Ocean surface waters",
            option_b="Anomalous warming of central and eastern equatorial Pacific surface waters",
            option_c="Monsoon surge confined to the Arabian Sea only",
            option_d="Splitting of the subtropical jet stream over India",
            correct_option="B",
            explanation="El Niño is associated with anomalous warming of the central/eastern equatorial Pacific. It typically weakens the Indian summer monsoon.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2022, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Geography", topic="Indian Rivers", question_number="Q.22",
            question_text="Which of the following rivers does NOT originate in India?",
            option_a="Godavari", option_b="Beas",
            option_c="Indus", option_d="Kaveri",
            correct_option="C",
            explanation="The Indus originates in Tibet (China), near Lake Mansarovar, before entering India through Jammu & Kashmir.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2021, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Geography", topic="World Geography", question_number="Q.7",
            question_text="'Atacama Desert' is located in which continent?",
            option_a="Africa", option_b="Australia",
            option_c="South America", option_d="North America",
            correct_option="C",
            explanation="The Atacama Desert is in South America, along the Pacific coast of Chile and Peru. It is one of the driest places on Earth.",
            language="en", created_by=admin.id,
        ),
        # ── Polity ───────────────────────────────────────────────────────────────
        PastYearProblem(
            year=2021, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Polity", topic="DPSP", question_number="Q.11",
            question_text="Which of the following Directive Principles were added by the 42nd Constitutional Amendment (1976)?",
            option_a="Only Article 39",
            option_b="Articles 39A and 48A",
            option_c="Only Article 48A",
            option_d="Articles 39A, 43A and 48A",
            correct_option="D",
            explanation="The 42nd Amendment (1976) added Articles 39A (free legal aid), 43A (workers' participation in management), and 48A (protection of environment).",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2023, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Polity", topic="Parliament", question_number="Q.31",
            question_text="Which of the following statements about the 'Zero Hour' in the Indian Parliament is correct?",
            option_a="It is provided for in the Constitution",
            option_b="It takes place just before Question Hour",
            option_c="It is an informal device allowing members to raise urgent public matters",
            option_d="It lasts exactly one hour every day",
            correct_option="C",
            explanation="Zero Hour is not mentioned in the Constitution or Rules of Procedure. It is an informal convention starting at noon (after Question Hour) where members raise urgent matters without prior notice.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2024, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Polity", topic="Fundamental Rights", question_number="Q.3",
            question_text="Article 21A of the Constitution of India provides for:",
            option_a="Right to life and personal liberty",
            option_b="Right to free and compulsory education for children aged 6–14",
            option_c="Right against exploitation",
            option_d="Right to constitutional remedies",
            correct_option="B",
            explanation="Article 21A, inserted by the 86th Amendment Act 2002, provides for free and compulsory education for children between 6 and 14 years of age as a Fundamental Right.",
            language="en", created_by=admin.id,
        ),
        # ── Economy ──────────────────────────────────────────────────────────────
        PastYearProblem(
            year=2020, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Economy", topic="Banking", question_number="Q.33",
            question_text="Cash Reserve Ratio (CRR) refers to the fraction of NDTL that banks must maintain:",
            option_a="With themselves as cash in their vaults",
            option_b="As deposits with the Reserve Bank of India",
            option_c="Invested in government and approved securities",
            option_d="In the form of gold reserves with RBI",
            correct_option="B",
            explanation="CRR is the percentage of a bank's Net Demand and Time Liabilities (NDTL) that it must keep as cash deposits with the RBI. It is a monetary policy instrument.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2022, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Economy", topic="Fiscal Policy", question_number="Q.44",
            question_text="Which of the following is NOT included in the 'Revenue Budget' of the Government of India?",
            option_a="Tax revenues",
            option_b="Interest payments on past debt",
            option_c="Loans given to state governments",
            option_d="Grants given to state governments",
            correct_option="C",
            explanation="Loans given to state governments are a capital expenditure and are part of the Capital Budget, not the Revenue Budget.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2023, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Economy", topic="International Trade", question_number="Q.50",
            question_text="'Most Favoured Nation (MFN)' status in the context of the WTO means:",
            option_a="Giving preferential tariff to the most important trading partner only",
            option_b="Treating all WTO member nations equally in trade matters",
            option_c="Reducing tariffs to zero for the granting country",
            option_d="Allowing free movement of labour between member countries",
            correct_option="B",
            explanation="MFN (now called Permanent Normal Trade Relations) is a principle in WTO trade law that requires equal treatment of all member nations—any advantage given to one must be extended to all.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2024, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Economy", topic="Inflation", question_number="Q.27",
            question_text="Which index is primarily used by the RBI for its inflation targeting framework in India?",
            option_a="Wholesale Price Index (WPI)",
            option_b="Consumer Price Index – Industrial Workers (CPI-IW)",
            option_c="Consumer Price Index – Combined (CPI-C)",
            option_d="GDP Deflator",
            correct_option="C",
            explanation="Following the FRBM amendment and the Monetary Policy Framework Agreement (2015), RBI targets CPI-Combined (CPI-C) for inflation targeting, with a target of 4% ± 2%.",
            language="en", created_by=admin.id,
        ),
        # ── Environment ──────────────────────────────────────────────────────────
        PastYearProblem(
            year=2022, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Environment", topic="Biodiversity", question_number="Q.42",
            question_text="Which one of the following is a primary consumer in a grassland ecosystem?",
            option_a="Grass", option_b="Grasshopper",
            option_c="Snake", option_d="Hawk",
            correct_option="B",
            explanation="Primary consumers are herbivores that directly feed on producers. In a grassland, grasshoppers eat grass and are therefore primary consumers.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2023, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Environment", topic="Climate Change", question_number="Q.60",
            question_text="'Nationally Determined Contributions (NDCs)' are submitted by countries under which agreement?",
            option_a="Kyoto Protocol", option_b="Montreal Protocol",
            option_c="Paris Agreement", option_d="UNFCCC itself",
            correct_option="C",
            explanation="NDCs are pledges made by each country party to the Paris Agreement (2015), outlining their plans to reduce greenhouse gas emissions and adapt to climate change.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2024, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Environment", topic="Protected Areas", question_number="Q.38",
            question_text="A 'Biosphere Reserve' in India differs from a National Park primarily in that:",
            option_a="Biosphere Reserves allow no human activity at all",
            option_b="Biosphere Reserves have a buffer zone allowing sustainable human use",
            option_c="National Parks are managed by the central government only",
            option_d="National Parks include marine areas while Biosphere Reserves do not",
            correct_option="B",
            explanation="A Biosphere Reserve has three zones: core (strictly protected), buffer (limited research/tourism), and transition (human settlements and sustainable use). National Parks permit no human habitation at all.",
            language="en", created_by=admin.id,
        ),
        # ── Science & Technology ─────────────────────────────────────────────────
        PastYearProblem(
            year=2023, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Science & Technology", topic="Space", question_number="Q.71",
            question_text="India's 'Chandrayaan-3' mission successfully made a soft landing near the Moon's:",
            option_a="Equatorial region", option_b="North pole",
            option_c="South pole", option_d="Far side",
            correct_option="C",
            explanation="Chandrayaan-3 achieved a historic soft landing near the Moon's south pole on 23 August 2023, making India the first country to land a spacecraft in that region.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2022, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Science & Technology", topic="Biotechnology", question_number="Q.65",
            question_text="CRISPR-Cas9 technology is primarily used for:",
            option_a="Protein synthesis in industrial scale",
            option_b="Precise editing of DNA sequences in living organisms",
            option_c="Producing vaccines through viral vectors only",
            option_d="Cloning of whole organisms from somatic cells",
            correct_option="B",
            explanation="CRISPR-Cas9 is a revolutionary gene-editing tool that allows scientists to precisely cut and modify DNA sequences in any organism, with wide applications in medicine and agriculture.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2024, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Science & Technology", topic="Defence", question_number="Q.80",
            question_text="'DRDO's Agni-V missile' is best described as a:",
            option_a="Short-range surface-to-air missile",
            option_b="Intercontinental ballistic missile (ICBM) with a range over 5,000 km",
            option_c="Supersonic cruise missile",
            option_d="Anti-tank guided missile",
            correct_option="B",
            explanation="Agni-V is an intercontinental ballistic missile developed by DRDO with a range of over 5,000 km (some estimates 7,000–8,000 km), capable of carrying nuclear warheads.",
            language="en", created_by=admin.id,
        ),
        # ── Art & Culture ─────────────────────────────────────────────────────────
        PastYearProblem(
            year=2022, exam_type=PastYearExamType.PRELIMS, paper="CSE Prelims",
            subject="Art & Culture", topic="Classical Dance", question_number="Q.16",
            question_text="'Manipuri' classical dance form originated in which state of India?",
            option_a="Assam", option_b="Odisha",
            option_c="Manipur", option_d="Meghalaya",
            correct_option="C",
            explanation="Manipuri is one of the eight classical dance forms of India, originating in Manipur. It is known for its graceful movements depicting Vaishnavite themes.",
            language="en", created_by=admin.id,
        ),
        # ── Mains subjective questions ────────────────────────────────────────────
        PastYearProblem(
            year=2023, exam_type=PastYearExamType.MAINS, paper="GS Paper II",
            subject="Polity", topic="Federalism", question_number="Q.4",
            question_text="Cooperative federalism has been largely replaced by competitive federalism in recent years. Critically examine this statement in the context of centre-state relations in India.",
            option_a=None, option_b=None, option_c=None, option_d=None,
            correct_option=None,
            explanation="A well-structured answer should cover: NITI Aayog vs Planning Commission, Finance Commission recommendations, GST Council, state competition for investment, inter-state river disputes, and suggestions for better cooperative mechanisms.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2022, exam_type=PastYearExamType.MAINS, paper="GS Paper III",
            subject="Economy", topic="Infrastructure", question_number="Q.7",
            question_text="What are the key challenges in infrastructure financing in India? Critically analyse the role of National Infrastructure Pipeline (NIP) in addressing these challenges.",
            option_a=None, option_b=None, option_c=None, option_d=None,
            correct_option=None,
            explanation="Cover: financing gap, PPP model issues, land acquisition bottlenecks, regulatory delays; NIP's contribution—project pipeline, hybrid annuity model, InvITs, and long-term institutional investors.",
            language="en", created_by=admin.id,
        ),
        PastYearProblem(
            year=2024, exam_type=PastYearExamType.MAINS, paper="GS Paper I",
            subject="History", topic="Social Reform", question_number="Q.2",
            question_text="Critically examine the contribution of Raja Ram Mohan Roy to the social and religious reform movements in 19th century India.",
            option_a=None, option_b=None, option_c=None, option_d=None,
            correct_option=None,
            explanation="Key points: Brahmo Samaj (1828), campaign against Sati (Bengal Sati Regulation 1829), women's education, rationalist outlook, press freedom advocacy, and his criticism of Hindu orthodoxy while drawing on Vedantic philosophy.",
            language="en", created_by=admin.id,
        ),
    ]
    db.add_all(extra_pyq)

    # ── Additional community Q&A for a richer feed ────────────────────────────
    q3 = Question(
        title="What is the significance of the Preamble to the Indian Constitution?",
        content="How does the Preamble guide constitutional interpretation? Can it be amended?",
        user_id=admin.id,
        is_anonymous=False,
        is_solved=False,
        upvotes=11,
        downvotes=0,
    )
    q4 = Question(
        title="How to differentiate between Prelims and Mains answer writing styles?",
        content="In mains, should I always use bullet points or prefer paragraph form? What do toppers recommend?",
        user_id=rahul.id,
        is_anonymous=False,
        is_solved=False,
        upvotes=24,
        downvotes=0,
    )
    q5 = Question(
        title="Best strategy for Current Affairs in 3 months before Prelims?",
        content="I have only 3 months left. Should I focus only on last 6 months current affairs or go back a full year?",
        user_id=priya.id,
        is_anonymous=True,
        is_solved=False,
        upvotes=32,
        downvotes=0,
    )
    db.add_all([q3, q4, q5])
    db.flush()

    for q, tlist in [(q3, ["GS2", "Polity"]), (q4, ["GS3"]), (q5, ["GS1", "GS3"])]:
        for tn in tlist:
            if tn in tags:
                db.add(QuestionTag(question_id=q.id, tag_id=tags[tn].id))

    db.add_all([
        Answer(
            content=(
                "The Preamble is the soul of the Constitution (Kesavananda Bharati case). It declares India as "
                "Sovereign, Socialist, Secular, Democratic Republic. The Supreme Court held in Minerva Mills that "
                "the Preamble is part of the Constitution and guides interpretation of ambiguous provisions. "
                "It CAN be amended (42nd Amendment added 'Socialist' and 'Secular') but the basic structure doctrine limits this."
            ),
            question_id=q3.id, user_id=priya.id,
            is_accepted=False, upvotes=14, downvotes=0,
        ),
        Answer(
            content=(
                "For Mains: use paragraphs for 15-mark answers, mix of bullets and paragraphs for 10-mark. "
                "Always include an introduction, 2-3 substantive points with examples, and a balanced conclusion. "
                "Avoid bullet-only answers—examiners prefer analytical writing."
            ),
            question_id=q4.id, user_id=admin.id,
            is_accepted=True, upvotes=18, downvotes=0,
        ),
        Answer(
            content=(
                "Focus on the last 12 months, not just 6. Cover themes rather than events: "
                "economy, environment, polity, international relations. Use Vision IAS/Insights monthly magazine. "
                "The CSAT component also tests logical reasoning—don't neglect it."
            ),
            question_id=q5.id, user_id=admin.id,
            is_accepted=False, upvotes=27, downvotes=0,
        ),
        Answer(
            content=(
                "3 months is enough if you follow a theme-based approach. Group events by topic (e.g., all India-China "
                "events together). This helps in writing structured answers in Mains too."
            ),
            question_id=q5.id, user_id=priya.id,
            is_accepted=False, upvotes=9, downvotes=0,
        ),
    ])
    db.flush()

    # ── Current Affairs (7 published items across GS papers) ─────────────────
    today = date.today()
    ca_items = [
        CurrentAffair(
            title="RBI cuts repo rate by 25 bps to 6.0% — signals accommodative stance",
            summary=(
                "The Reserve Bank of India's MPC unanimously voted to reduce the repo rate by 25 basis points "
                "to 6.0%, the second consecutive cut in 2026. Governor cited easing inflation and sluggish "
                "private investment as key drivers. CRR remains unchanged at 4%."
            ),
            detailed_notes=(
                "Key UPSC angles:\n"
                "1. Monetary Policy Committee (MPC) — composition (3 RBI + 3 Govt nominees), voting mechanism.\n"
                "2. Repo rate vs Reverse Repo vs SLR vs CRR — distinguish clearly.\n"
                "3. Transmission lag — why rate cuts take 3-6 months to affect borrowing costs.\n"
                "4. Inflation targeting framework (FRBM 2016) — 4% ± 2% target on CPI-Combined.\n"
                "Way forward: Effective monetary transmission requires banking sector health, reducing NPAs."
            ),
            syllabus_links="GS3: Indian Economy — Money and Banking; GS3: Monetary Policy",
            source_name="RBI Press Release",
            source_url="https://www.rbi.org.in",
            gs_paper="GS3",
            subject_tags="Monetary Policy,RBI,Repo Rate,MPC,Inflation,Economy",
            published_date=today,
            is_published=True,
            is_upsc_relevant=True,
            created_by=admin.id,
        ),
        CurrentAffair(
            title="India and China complete disengagement at Depsang and Demchok",
            summary=(
                "India and China have formally completed military disengagement at the last two friction points "
                "— Depsang plains and Demchok in Eastern Ladakh — ending a four-year standoff following the "
                "Galwan clash of June 2020. Patrolling rights have been restored to pre-April 2020 positions."
            ),
            detailed_notes=(
                "Key UPSC angles:\n"
                "1. Line of Actual Control (LAC) — no demarcated boundary unlike Line of Control (LoC) with Pakistan.\n"
                "2. India-China border history: McMahon Line (1914), Panchsheel Agreement (1954), 1962 war, Simla Convention.\n"
                "3. Recent: Galwan Valley clash (June 2020), Pangong Tso disengagement (Feb 2021), Buffer zones.\n"
                "4. WION, NDTV Friction Points Map — Depsang, Demchok, Hot Springs, Gogra Post.\n"
                "5. Significance: India-China trade ~$118 billion; decoupling vs engagement debate.\n"
                "Criticism: 'Restoration of status quo ante' vs 'new normal' — buffer zones remain."
            ),
            syllabus_links="GS2: India and its Neighbourhood; GS2: Bilateral Relations; GS2: Effect of Policies of Developed Countries",
            source_name="The Hindu",
            source_url="https://www.thehindu.com",
            gs_paper="GS2",
            subject_tags="India-China,LAC,Border Dispute,Depsang,Foreign Policy",
            published_date=today - timedelta(days=1),
            is_published=True,
            is_upsc_relevant=True,
            created_by=admin.id,
        ),
        CurrentAffair(
            title="Supreme Court upholds PMLA provisions — reaffirms ED's arrest powers",
            summary=(
                "A three-judge bench of the Supreme Court upheld key provisions of the Prevention of Money "
                "Laundering Act (PMLA) 2002, including the Enforcement Directorate's power of arrest without "
                "a magistrate's warrant. The bench relied on the Vijay Madanlal Choudhary (2022) precedent."
            ),
            detailed_notes=(
                "Key UPSC angles:\n"
                "1. PMLA 2002 — origin, FATF recommendations, Schedule of offences.\n"
                "2. Enforcement Directorate — under Finance Ministry; not under CBI; dual mandate (PMLA + FEMA).\n"
                "3. Bail provisions under PMLA — 'twin conditions' (S.45); burden of proof on accused.\n"
                "4. Constitutional challenge — Articles 14, 20(3) (self-incrimination), 21.\n"
                "5. Landmark cases: Nikesh Tarachand Shah (2018), Vijay Madanlal Choudhary (2022).\n"
                "Concerns: Civil liberties groups argue PMLA gives excessive power to prosecution."
            ),
            syllabus_links="GS2: Statutory Bodies; GS2: Judiciary; GS3: Money Laundering and Organised Crime",
            source_name="Indian Express",
            source_url="https://indianexpress.com",
            gs_paper="GS2",
            subject_tags="PMLA,ED,Supreme Court,Money Laundering,Judiciary,Civil Liberties",
            published_date=today - timedelta(days=1),
            is_published=True,
            is_upsc_relevant=True,
            created_by=admin.id,
        ),
        CurrentAffair(
            title="India records 52°C in Rajasthan — IMD issues red alert for 12 states",
            summary=(
                "India's northwest recorded its highest temperature of 2026 at 52.3°C in Barmer, Rajasthan. "
                "IMD issued red alerts across 12 states. The National Disaster Management Authority (NDMA) "
                "activated Heat Action Plans in affected districts, with specific protocols for farm workers."
            ),
            detailed_notes=(
                "Key UPSC angles:\n"
                "1. Heat Action Plans — Ahmedabad model (2013) — first city-level heat plan in South Asia.\n"
                "2. NDMA guidelines — color-coded alerts, cooling centres, school closures.\n"
                "3. Urban Heat Island effect — dark surfaces, reduced green cover, lack of water bodies.\n"
                "4. Climate change linkage — IPCC AR6: South Asia most vulnerable; wet-bulb temperature concept.\n"
                "5. Occupational safety — unorganised sector workers, BOCW Act, migrant labour.\n"
                "6. Compare: Heat dome events in Canada (2021), Europe (2022).\n"
                "GS4 angle: Government's duty of care vs individual responsibility in public health emergencies."
            ),
            syllabus_links=(
                "GS1: Climatology; GS3: Disaster Management; GS3: Environmental Pollution; "
                "GS2: Health; GS4: Ethics in Public Administration"
            ),
            source_name="IMD Bulletin",
            gs_paper="GS1+GS3",
            subject_tags="Heatwave,Climate Change,Disaster Management,IMD,NDMA,Urban Heat Island",
            published_date=today - timedelta(days=2),
            is_published=True,
            is_upsc_relevant=True,
            created_by=admin.id,
        ),
        CurrentAffair(
            title="SEBI tightens IPO norms for SME platforms — raises minimum application size",
            summary=(
                "SEBI's board approved sweeping reforms for the SME IPO segment, raising the minimum application "
                "amount from ₹1 lakh to ₹2 lakh and mandating a 3-year operating profit track record. The move "
                "follows concerns about price manipulation in the SME exchange segment."
            ),
            detailed_notes=(
                "Key UPSC angles:\n"
                "1. SEBI — statutory body under SEBI Act 1992; three-fold mandate (investor protection, market development, regulation).\n"
                "2. SME IPO vs mainboard IPO — BSE SME / NSE Emerge platforms; lower disclosure norms historically.\n"
                "3. Investor protection — grievance redressal (SCORES portal), demat accounts, ASBA mechanism.\n"
                "4. Price manipulation — pump and dump, circular trading; SEBI enforcement powers.\n"
                "5. Capital market reforms trajectory: Bhave Committee → Bajaj Committee → SEBI 2024-25 reforms.\n"
                "Note: Contrast SEBI (securities) vs RBI (banking) vs IRDAI (insurance) — sectoral regulators."
            ),
            syllabus_links="GS3: Indian Economy — Capital Market; GS3: Regulatory Bodies; GS2: Statutory Bodies",
            source_name="SEBI Press Release",
            gs_paper="GS3",
            subject_tags="SEBI,IPO,SME,Capital Market,Investor Protection,Stock Exchange",
            published_date=today - timedelta(days=2),
            is_published=True,
            is_upsc_relevant=True,
            created_by=admin.id,
        ),
        CurrentAffair(
            title="NEP 2020 — government releases 5-year implementation report",
            summary=(
                "The Ministry of Education released a comprehensive report on National Education Policy 2020 "
                "implementation. Key achievements: mother-tongue medium in 22,000 schools, PM SHRI schools "
                "operational, and 30% increase in vocational enrollment at secondary level."
            ),
            detailed_notes=(
                "Key UPSC angles:\n"
                "1. NEP 2020 — replaces NPE 1986; vision: 'holistic, multidisciplinary, flexible' education.\n"
                "2. Structural change: 10+2 → 5+3+3+4 (Foundational, Preparatory, Middle, Secondary).\n"
                "3. Key features: mother tongue instruction till Std 5, no hard science/arts stream divide, "
                "4-year UG with multiple exit points, Academic Bank of Credits (ABC).\n"
                "4. PM SHRI schools — PM Schools for Rising India; central benchmark schools.\n"
                "5. Gross Enrolment Ratio (GER) targets: 50% by 2035 in higher education (currently ~28%).\n"
                "6. PARAKH — National Assessment body replacing board exam monopoly.\n"
                "Criticism: Implementation uneven across states; teacher training gap; language barrier for regional languages."
            ),
            syllabus_links="GS2: Social Justice — Education; GS2: Government Policies and Interventions",
            source_name="Ministry of Education",
            gs_paper="GS2",
            subject_tags="NEP 2020,Education Policy,PM SHRI,GER,Mother Tongue,Social Justice",
            published_date=today - timedelta(days=3),
            is_published=True,
            is_upsc_relevant=True,
            created_by=admin.id,
        ),
        CurrentAffair(
            title="India formally joins Artemis Accords — ISRO to partner on lunar missions",
            summary=(
                "India signed the NASA-led Artemis Accords, committing to norms for responsible space exploration "
                "including transparency, interoperability, and avoiding harmful interference. ISRO and NASA will "
                "collaborate on a joint crewed mission to the International Space Station by 2027."
            ),
            detailed_notes=(
                "Key UPSC angles:\n"
                "1. Artemis Accords (2020) — US-led, non-binding; principle of peaceful use of space.\n"
                "2. Outer Space Treaty (1967) — space as 'province of all mankind'; no national appropriation.\n"
                "3. ISRO milestones: Chandrayaan-3 (2023 south pole landing), Aditya-L1, Gaganyaan (crewed mission).\n"
                "4. IN-SPACe — India's regulator for private space sector (2020); enable NewSpace India Ltd (NSIL).\n"
                "5. ISRO vs private: Skyroot Aerospace, Agnikul Cosmos — India's SpaceX equivalents.\n"
                "6. Geopolitical: US-led vs China-Russia lunar cooperation — competing space governance frameworks."
            ),
            syllabus_links="GS3: Science & Technology — Space; GS2: International Relations; GS3: Indigenisation of Technology",
            source_name="MEA Press Release",
            gs_paper="GS3",
            subject_tags="Artemis Accords,ISRO,NASA,Space Policy,Outer Space Treaty,Lunar Mission",
            published_date=today - timedelta(days=3),
            is_published=True,
            is_upsc_relevant=True,
            created_by=admin.id,
        ),
    ]
    db.add_all(ca_items)
    db.flush()

    # ── Daily Question queue (14 questions — 2 weeks rotation) ────────────────
    # First one is already active (the federalism question above is dq).
    # These are queued (is_active=False) for the scheduler to rotate through.
    daily_queue = [
        DailyQuestion(
            title="RBI's monetary policy tools and inflation management (15 marks, GS3)",
            content=(
                "Examine how the Reserve Bank of India uses monetary policy instruments to manage inflation. "
                "In light of the recent repo rate cuts, critically analyse the effectiveness of monetary "
                "transmission in India."
            ),
            subject="GS3 — Indian Economy",
            word_limit=250, marks=15,
            model_answer=(
                "Intro: RBI's mandate — price stability + growth. "
                "Body: Instruments — Repo, Reverse Repo, CRR, SLR, OMOs, MSF; "
                "Transmission channels — credit, asset prices, exchange rate; "
                "India-specific challenges — banking sector NPAs, informal sector, rural credit gaps. "
                "Conclusion: Coordination with fiscal policy; financial inclusion for better transmission."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=1),
        ),
        DailyQuestion(
            title="India-China border management and bilateral relations (15 marks, GS2)",
            content=(
                "Following the Galwan disengagement, assess the current state of India-China bilateral "
                "relations. What structural factors create tensions along the LAC despite periodic "
                "diplomatic engagements?"
            ),
            subject="GS2 — International Relations",
            word_limit=250, marks=15,
            model_answer=(
                "Intro: Significance of India-China relationship — largest neighbours by population. "
                "Body: Positive dimensions — trade (~$118 bn), cultural ties, multilateral platforms (SCO, BRICS); "
                "Tensions — LAC ambiguity, no formal boundary treaty, China's infrastructure near LAC, string of pearls; "
                "Post-Galwan — decoupling in FDI, app bans, supply chain diversification. "
                "Conclusion: Normalisation needed but trust deficit remains; 'walking and talking simultaneously'."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=2),
        ),
        DailyQuestion(
            title="Prevention of Money Laundering Act — civil liberties vs enforcement (10 marks, GS2)",
            content=(
                "The PMLA 2002 has been both praised as an anti-corruption tool and criticised as violating "
                "civil liberties. Critically examine the constitutional validity and impact of PMLA's "
                "stringent bail and attachment provisions."
            ),
            subject="GS2 — Governance; Judiciary",
            word_limit=150, marks=10,
            model_answer=(
                "Intro: PMLA 2002 — FATF recommendations; Schedule of predicate offences. "
                "Upheld by SC: Vijay Madanlal Choudhary (2022) — twin conditions for bail constitutional. "
                "Concerns: reverse burden of proof, prolonged incarceration, misuse; "
                "Compare UK Proceeds of Crime Act — more balanced safeguards. "
                "Conclusion: Strengthen ED accountability; fast-track courts for PMLA trials."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=3),
        ),
        DailyQuestion(
            title="Urban heat islands and climate adaptation (10 marks, GS3)",
            content=(
                "Urban Heat Islands (UHIs) amplify the impact of heatwaves in Indian cities. "
                "Analyse the causes and suggest comprehensive mitigation measures with examples from "
                "Indian cities."
            ),
            subject="GS3 — Environment; GS1 — Climatology",
            word_limit=150, marks=10,
            model_answer=(
                "Intro: UHI — urban areas 2-5°C warmer than rural surroundings. "
                "Causes: Dark impervious surfaces, lack of green cover, anthropogenic heat (AC, vehicles). "
                "Mitigation: Green roofs (Singapore model), cool pavements, urban forests, water bodies; "
                "Ahmedabad Heat Action Plan; Chennai Cooling Strategy. "
                "Conclusion: Integrate UHI mapping in master plans; climate-resilient zoning laws."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=4),
        ),
        DailyQuestion(
            title="National Education Policy 2020 — transformative potential and challenges (15 marks, GS2)",
            content=(
                "NEP 2020 promises the most comprehensive overhaul of India's education system since independence. "
                "Critically examine its key provisions and the challenges in implementation, particularly "
                "at the school education level."
            ),
            subject="GS2 — Social Justice; Education",
            word_limit=250, marks=15,
            model_answer=(
                "Intro: NEP 2020 — replacing NPE 1986 after 34 years; vision of 'holistic education'. "
                "Key provisions: 5+3+3+4 structure, mother-tongue instruction, vocational integration, "
                "PARAKH, Academic Bank of Credits. "
                "Challenges: Teacher training deficit, state-centre coordination (Education in Concurrent List), "
                "language politics, digital divide, funding (6% GDP target unreached). "
                "Conclusion: Bottom-up implementation; empower local school governance bodies."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=5),
        ),
        DailyQuestion(
            title="Space diplomacy and India's role in shaping global space governance (10 marks, GS2)",
            content=(
                "With India joining the Artemis Accords and making strides in space exploration, "
                "critically analyse India's space diplomacy strategy and its implications for global "
                "space governance."
            ),
            subject="GS2 — International Relations; GS3 — Science & Technology",
            word_limit=150, marks=10,
            model_answer=(
                "Intro: Outer Space Treaty (1967) — foundational; increasingly strained by new actors. "
                "India's space diplomacy: Artemis Accords (US-led), BRICS space cooperation, SAARC satellite; "
                "ISRO's commercial services — Antrix; NewSpace India Ltd. "
                "Governance gap: No binding framework on space debris, lunar resource extraction; "
                "Moon Agreement (1979) — India not a signatory. "
                "Conclusion: India to champion 'Space for All' narrative; push for UN COPUOS reform."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=6),
        ),
        DailyQuestion(
            title="Gig economy workers and social security — a policy challenge (15 marks, GS2)",
            content=(
                "The Code on Social Security 2020 includes provisions for gig and platform workers, "
                "but implementation remains limited. Critically examine the challenges of extending "
                "social security to this segment of India's workforce."
            ),
            subject="GS2 — Social Justice; Labour",
            word_limit=250, marks=15,
            model_answer=(
                "Intro: Gig economy — 7.7 mn workers (NITI Aayog 2022); expected 23.5 mn by 2030. "
                "Code on Social Security 2020: first legislative recognition; Aggregator's contribution to welfare fund. "
                "Challenges: Classification (employee vs independent contractor), enforcement, data portability, "
                "multiple platform workers. International models: UK SC ruling on Uber (2021); EU Platform Work Directive (2024). "
                "Conclusion: Portable benefits model (like US 'Portable Benefits'); strengthen ESIC-equivalent for gig workers."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=7),
        ),
        DailyQuestion(
            title="Judicial overreach vs judicial activism — a fine line (10 marks, GS2)",
            content=(
                "Indian courts have frequently intervened in policy matters citing fundamental rights. "
                "Where does judicial activism end and judicial overreach begin? Discuss with recent examples."
            ),
            subject="GS2 — Judiciary; Governance",
            word_limit=150, marks=10,
            model_answer=(
                "Intro: Judicial activism — court fills legislative vacuum to protect rights; born from Golaknath, "
                "Kesavananda Bharati, Minerva Mills. "
                "Activism examples: Right to food (PUCL v Union of India), forest conservation orders. "
                "Overreach concerns: Courts directing policy on Cauvery water, Delhi pollution — executive functions. "
                "Doctrine: Separation of powers; Polycentric issues (courts ill-equipped for resource allocation). "
                "Conclusion: Structural injunctions with compliance monitoring; dialogue model over command-and-control."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=8),
        ),
        DailyQuestion(
            title="Internal displacement and climate refugees — India's obligations (10 marks, GS2)",
            content=(
                "Climate change is expected to displace 216 million people internally by 2050 (World Bank). "
                "Examine India's preparedness and obligations towards climate-induced internal displacement."
            ),
            subject="GS2 — International Relations; GS1 — Disaster; GS3 — Environment",
            word_limit=150, marks=10,
            model_answer=(
                "Intro: UNHCR — 'climate refugees' not recognised under 1951 Refugee Convention. "
                "India's vulnerability: Coastal Odisha/West Bengal, Assam floods, Himalayan glacial melt. "
                "Guiding Principles on Internal Displacement (1998) — non-binding; India follows National Disaster "
                "Management Plan. "
                "Gaps: No domestic IDPs policy; Char-dwellers of Assam, Sundarbans erosion. "
                "Conclusion: Enact National Displacement Policy; integrate climate risk in urban planning."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=9),
        ),
        DailyQuestion(
            title="India's critical minerals strategy (15 marks, GS3)",
            content=(
                "Critical minerals are central to India's energy transition and national security. "
                "Critically examine India's critical minerals policy framework and the challenges "
                "in securing a diversified supply chain."
            ),
            subject="GS3 — Economy; Energy; Security",
            word_limit=250, marks=15,
            model_answer=(
                "Intro: Critical minerals — lithium, cobalt, nickel, REEs; essential for EVs, solar, defence. "
                "India's strategy: KABIL (Khanij Bidesh India Ltd) for overseas acquisition; "
                "30 critical minerals identified (KPMG/Ministry report 2023); Amendment to MMDR Act 2021. "
                "Challenges: Import dependency (China: 70% REE refining), deep-sea mining tech gap, "
                "environmental concerns in domestic mining. "
                "International: India-Australia Critical Minerals Partnership; Mineral Security Partnership (US-led). "
                "Conclusion: Build domestic processing capacity; circular economy for e-waste recovery."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=10),
        ),
        DailyQuestion(
            title="Decentralisation and Panchayati Raj — 73rd Amendment 30 years on (15 marks, GS2)",
            content=(
                "Thirty years after the 73rd Constitutional Amendment, genuine democratic decentralisation "
                "remains elusive in most Indian states. Critically examine the structural and political "
                "barriers to effective Panchayati Raj."
            ),
            subject="GS2 — Polity; Governance",
            word_limit=250, marks=15,
            model_answer=(
                "Intro: 73rd Amendment 1992 — 3-tier PRIs; Schedule XI (29 subjects); SFC, SEC. "
                "Progress: Elections regularised, SC/ST/Women reservation (33-50%), capacity building. "
                "Barriers: 'Mafia' capture of gram panchayats; parallel bodies (MGNREGS, JJM bypassing PRIs); "
                "inadequate devolution of the 3Fs (Funds, Functions, Functionaries); state government reluctance. "
                "Global comparison: Brazil's participatory budgeting; Kerala decentralisation model. "
                "Conclusion: Strengthen SFC recommendations compliance; Gram Sabha empowerment; "
                "direct fund transfer to GPs."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=11),
        ),
        DailyQuestion(
            title="Essay: Technology is a great leveller — but only if we choose it to be (250 words)",
            content=(
                "Write an essay on the theme: 'Technology is a great leveller — but only if we choose it to be.' "
                "You may approach this from economic, social, or political dimensions."
            ),
            subject="Essay",
            word_limit=250, marks=25,
            model_answer=(
                "Structure guide: "
                "Para 1 (Hook): Example — JAM Trinity democratising financial services for 500 mn unbanked. "
                "Para 2 (Argument for): UPI levelling payments; MOOCs levelling education; telemedicine levelling healthcare. "
                "Para 3 (Counter): Digital divide (45% internet penetration in rural India); AI bias; platform monopolies. "
                "Para 4 (Resolution): Technology is a tool — outcomes depend on policy, regulation, and political will. "
                "Conclusion: Amartya Sen's Capability Approach — technology must expand real freedoms, not just access."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=12),
        ),
        DailyQuestion(
            title="Water security and inter-state river disputes (15 marks, GS2)",
            content=(
                "Inter-state river disputes have become increasingly contentious in India. Critically examine "
                "the legal and institutional framework for resolving such disputes and suggest reforms."
            ),
            subject="GS2 — Polity; Federalism",
            word_limit=250, marks=15,
            model_answer=(
                "Intro: India's river basins cross multiple states; water in State List (Entry 17). "
                "Framework: ISWD Act 1956 — tribunals; Cauvery, Krishna, Ravi-Beas, Narmada Tribunals. "
                "Problems: Prolonged delays (Cauvery tribunal — 26 years); non-implementation of awards; "
                "no enforcement mechanism; political use of water disputes. "
                "Reform: Parliamentary river board under Union List; NWDA coordination; Interlinking of Rivers (pros/cons). "
                "Global models: Mekong River Commission; Indus Waters Treaty (despite tensions). "
                "Conclusion: Depoliticise water — treat as national commons; strengthen River Basin Authorities."
            ),
            is_active=False, posted_by=admin.id,
            date=now + timedelta(days=13),
        ),
    ]
    db.add_all(daily_queue)
    db.flush()

    # ── Quiz Questions bank (10 approved MCQs, linked where possible to CA) ──
    ca_rbi = ca_items[0]   # RBI repo rate
    ca_heat = ca_items[3]  # Heatwave
    ca_nep = ca_items[5]   # NEP

    quiz_qs = [
        QuizQuestion(
            subject="Economy",
            topic="Monetary Policy",
            difficulty="medium",
            question_text="When the RBI reduces the repo rate, what is the most direct immediate impact?",
            option_a="Government's fiscal deficit automatically reduces",
            option_b="Commercial banks' cost of short-term borrowing from RBI decreases",
            option_c="Foreign exchange reserves of India increase",
            option_d="Inflation automatically falls to the 4% target",
            correct_option="B",
            explanation=(
                "Repo rate is the rate at which RBI lends overnight funds to commercial banks. "
                "A reduction directly lowers banks' borrowing cost, which they may (with a lag) pass on "
                "as lower lending rates. Inflation reduction is an eventual outcome, not immediate."
            ),
            source="RBI Annual Report",
            current_affair_id=ca_rbi.id,
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="Economy",
            topic="Banking",
            difficulty="easy",
            question_text="Cash Reserve Ratio (CRR) is the fraction of a bank's NDTL maintained as:",
            option_a="Cash in the bank's own vaults",
            option_b="Investment in government securities",
            option_c="Cash deposits with the Reserve Bank of India",
            option_d="Foreign currency reserves with EXIM Bank",
            correct_option="C",
            explanation=(
                "CRR is the mandatory percentage of Net Demand and Time Liabilities (NDTL) that commercial banks "
                "must keep as deposits with the RBI. It is a key liquidity management and monetary policy tool."
            ),
            source="NCERT Macroeconomics Ch.3",
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="Polity",
            topic="Parliament",
            difficulty="medium",
            question_text=(
                "Which of the following statements about Zero Hour in the Indian Parliament is CORRECT?"
            ),
            option_a="It is explicitly mentioned in the Constitution under Article 118",
            option_b="It occurs before Question Hour every sitting day",
            option_c="It is an informal convention allowing urgent matters without prior notice",
            option_d="It is limited to exactly 60 minutes by Parliamentary rules",
            correct_option="C",
            explanation=(
                "Zero Hour is not mentioned in the Constitution or Rules of Procedure. "
                "It is an informal convention that starts around 12 noon (after Question Hour ends) "
                "where members can raise urgent matters of public importance without advance notice."
            ),
            source="Introduction to the Constitution of India — D.D. Basu",
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="Environment",
            topic="Climate & Disaster",
            difficulty="medium",
            question_text=(
                "Urban Heat Islands (UHIs) are caused primarily by which combination of factors?"
            ),
            option_a="Increased vegetation and reduced concrete surfaces",
            option_b="Albedo effect of snow and ice in polar cities",
            option_c="Dark impervious surfaces, reduced vegetation, and anthropogenic heat",
            option_d="High altitude and low humidity exclusively",
            correct_option="C",
            explanation=(
                "UHIs result from dark-coloured impervious surfaces (roads, buildings) absorbing more solar radiation, "
                "removal of vegetation (which provides evaporative cooling), and heat released by vehicles, "
                "air conditioners, and industries."
            ),
            source="IPCC AR6 Working Group II",
            current_affair_id=ca_heat.id,
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="Environment",
            topic="International Agreements",
            difficulty="easy",
            question_text="Nationally Determined Contributions (NDCs) are submitted by countries under which agreement?",
            option_a="Kyoto Protocol (1997)",
            option_b="Montreal Protocol (1987)",
            option_c="Paris Agreement (2015)",
            option_d="Stockholm Convention (2001)",
            correct_option="C",
            explanation=(
                "NDCs are the climate pledges submitted by each signatory to the Paris Agreement (2015). "
                "They are 'nationally determined' — each country sets its own targets, unlike the Kyoto Protocol "
                "which had binding top-down targets for developed nations."
            ),
            source="UNFCCC",
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="Polity",
            topic="Fundamental Rights",
            difficulty="easy",
            question_text="Article 21A of the Constitution guarantees which Fundamental Right?",
            option_a="Right to life and personal liberty",
            option_b="Right to free and compulsory education for children aged 6–14",
            option_c="Right against arbitrary arrest",
            option_d="Right to constitutional remedies",
            correct_option="B",
            explanation=(
                "Article 21A was inserted by the 86th Constitutional Amendment (2002). It provides the right "
                "to free and compulsory education for all children between 6 and 14 years as a Fundamental Right. "
                "This led to the RTE Act 2009."
            ),
            source="Constitution of India",
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="Economy",
            topic="International Trade",
            difficulty="medium",
            question_text=(
                "In WTO terminology, 'Most Favoured Nation (MFN)' treatment means a member country must:"
            ),
            option_a="Give the lowest tariff rate only to its most important trading partners",
            option_b="Extend any trade advantage given to one member to all other WTO members equally",
            option_c="Eliminate all tariffs with countries that sign MFN agreements",
            option_d="Allow free movement of workers from all member nations",
            correct_option="B",
            explanation=(
                "MFN is a cornerstone WTO principle under GATT Article I. If a member gives a trade advantage "
                "(like a reduced tariff) to any one member, it must immediately extend the same advantage "
                "to ALL other WTO members. India-Pakistan: India revoked MFN status to Pakistan in 2019."
            ),
            source="WTO Agreement",
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="Science & Technology",
            topic="Space",
            difficulty="easy",
            question_text="Chandrayaan-3 made India the first country to successfully land a spacecraft near the Moon's:",
            option_a="Equatorial region",
            option_b="North pole",
            option_c="South pole",
            option_d="Far side (dark side)",
            correct_option="C",
            explanation=(
                "Chandrayaan-3's Vikram lander touched down near the lunar south pole on 23 August 2023, "
                "making India the first country to achieve a soft landing in that region. The south pole is "
                "scientifically important for potential water ice in permanently shadowed craters."
            ),
            source="ISRO",
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="Governance",
            topic="Education Policy",
            difficulty="medium",
            question_text="Which structural change did NEP 2020 introduce to replace the existing 10+2 school system?",
            option_a="8+2+2 (Elementary, Secondary, Senior Secondary)",
            option_b="5+3+3+4 (Foundational, Preparatory, Middle, Secondary)",
            option_c="6+3+3 (Primary, Upper Primary, Secondary)",
            option_d="4+4+4 (Lower, Middle, Upper school)",
            correct_option="B",
            explanation=(
                "NEP 2020 introduced the 5+3+3+4 structure: "
                "Foundational (age 3-8, including 3 years preschool + Std 1-2), "
                "Preparatory (Std 3-5), Middle (Std 6-8), and Secondary (Std 9-12). "
                "This aligns with cognitive development stages."
            ),
            source="NEP 2020 Document, Ministry of Education",
            current_affair_id=ca_nep.id,
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
        QuizQuestion(
            subject="History",
            topic="Modern India",
            difficulty="easy",
            question_text="The Lucknow Pact of 1916 was significant because it represented:",
            option_a="Agreement between Congress and the British Government on constitutional reforms",
            option_b="Unity between the Indian National Congress and the Muslim League",
            option_c="Merger of Bal Gangadhar Tilak's and Gopal Krishna Gokhale's factions",
            option_d="First demand for complete independence (Purna Swaraj) from British rule",
            correct_option="B",
            explanation=(
                "The Lucknow Pact (December 1916) was an agreement between the Indian National Congress "
                "(led by Tilak) and the All-India Muslim League (led by Jinnah). It agreed on separate "
                "electorates for Muslims and joint demands for constitutional reforms from the British. "
                "It represented a high point of Hindu-Muslim political unity."
            ),
            source="NCERT Modern India Ch.11",
            language="en",
            is_approved=True,
            created_by=admin.id,
        ),
    ]
    db.add_all(quiz_qs)
    db.flush()

    # ── Reputation logs to make the leaderboard interesting ───────────────────
    rep_logs = [
        # admin earned reputation from multiple sources
        (admin.id, 200, "answer_accepted", "answer", None),
        (admin.id, 150, "study", "silent_session", None),
        (admin.id, 100, "answer_upvoted", "answer", None),
        # priya
        (priya.id, 100, "answer_accepted", "answer", None),
        (priya.id, 80, "study", "silent_session", None),
        (priya.id, 50, "question_upvoted", "question", None),
        # rahul
        (rahul.id, 30, "study", "silent_session", None),
        (rahul.id, 20, "answer_upvoted", "answer", None),
    ]
    for uid, pts, reason, stype, sid in rep_logs:
        db.add(ReputationLog(user_id=uid, points=pts, reason=reason, source_type=stype, source_id=sid))

    db.commit()
    _sync_redis_leaderboard(db, [admin.id, priya.id, rahul.id])


def seed_demo_data_if_enabled() -> None:
    """
    When SEED_DEMO_DATA is 1/true/yes, insert demo accounts once (if admin demo user missing).
    Intended for Docker Compose local dev.
    """
    raw = os.getenv("SEED_DEMO_DATA", "").strip().lower()
    if raw not in ("1", "true", "yes", "on"):
        return

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == admin_demo_email()).first():
            return
        print("[SEED_DEMO_DATA] Creating demo accounts (priya@demo.drishti.dev / Demo123!) …")
        seed_demo_data(db)
        print("[SEED_DEMO_DATA] Done.")
    except Exception as exc:  # noqa: BLE001
        print(f"[SEED_DEMO_DATA] Failed: {exc}")
    finally:
        db.close()


def clear_demo_users_for_cli(db: Session) -> None:
    """Used by seed_demo_data.py --force."""
    _clear_demo_users(db)
