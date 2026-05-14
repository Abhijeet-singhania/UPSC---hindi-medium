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
    DailyAnswer,
    DailyQuestion,
    ExamStage,
    PastYearExamType,
    PastYearProblem,
    Question,
    QuestionTag,
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
