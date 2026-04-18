from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.db.database import engine, SessionLocal
from app.db import models
from app.db.models import PastYearProblem, PastYearExamType

# Create database tables
models.Base.metadata.create_all(bind=engine)


def seed_past_year_problems():
    """Seed a few starter PYQs if the table is empty."""
    db = SessionLocal()
    try:
        existing_count = db.query(PastYearProblem).count()
        if existing_count > 0:
            return

        seed_items = [
            PastYearProblem(
                year=2023,
                exam_type=PastYearExamType.PRELIMS,
                paper="CSE Prelims",
                subject="Polity",
                topic="Constitution",
                question_number="Q.12",
                question_text="भारतीय संविधान में मौलिक अधिकारों के निलंबन के संबंध में निम्नलिखित कथनों पर विचार कीजिए...",
                option_a="केवल 1",
                option_b="केवल 2",
                option_c="1 और 2 दोनों",
                option_d="न तो 1, न ही 2",
                correct_option="C",
                explanation="मौलिक अधिकारों पर सीमित परिस्थितियों में रोक संभव है, लेकिन पूर्ण समाप्ति नहीं।",
                language="hi",
            ),
            PastYearProblem(
                year=2022,
                exam_type=PastYearExamType.PRELIMS,
                paper="CSE Prelims",
                subject="Economy",
                topic="Inflation",
                question_number="Q.27",
                question_text="मुद्रास्फीति लक्ष्यीकरण के संदर्भ में, भारत में MPC के बारे में कौन-सा कथन सही है?",
                option_a="MPC में केवल RBI सदस्य होते हैं",
                option_b="MPC में कुल 6 सदस्य होते हैं",
                option_c="MPC की बैठक हर महीने अनिवार्य है",
                option_d="MPC का निर्णय केवल गवर्नर लेते हैं",
                correct_option="B",
                explanation="MPC में 6 सदस्य होते हैं: RBI से 3 और केंद्र द्वारा नामित 3।",
                language="hi",
            ),
            PastYearProblem(
                year=2021,
                exam_type=PastYearExamType.MAINS,
                paper="GS3",
                subject="Economy",
                topic="Growth and Development",
                marks=15,
                word_limit=250,
                question_number="Q.3",
                question_text="भारत की आर्थिक वृद्धि में विनिर्माण क्षेत्र की भूमिका का विश्लेषण कीजिए।",
                explanation="उत्तर में रोजगार, निर्यात, MSME और नीति सुधारों का समावेश होना चाहिए।",
                language="hi",
            ),
            PastYearProblem(
                year=2020,
                exam_type=PastYearExamType.MAINS,
                paper="GS2",
                subject="Governance",
                topic="Local Governance",
                marks=10,
                word_limit=150,
                question_number="Q.6",
                question_text="स्थानीय स्वशासन संस्थाओं की प्रभावशीलता बढ़ाने के लिए आवश्यक सुधारों पर चर्चा करें।",
                explanation="उत्तर में वित्त, मानव संसाधन और जवाबदेही से जुड़े बिंदु अपेक्षित हैं।",
                language="hi",
            ),
        ]

        db.add_all(seed_items)
        db.commit()
    finally:
        db.close()


seed_past_year_problems()

app = FastAPI(
    title="UPSC Hindi Peer Network",
    description="A peer-to-peer UPSC Hindi learning ecosystem",
    version="0.1.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to UPSC Hindi Peer Network API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
