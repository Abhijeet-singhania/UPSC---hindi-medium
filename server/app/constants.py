"""
Application-wide constants.

These are fixed values that do not change between environments and contain
no sensitive data. Import from here instead of from config.settings.

For environment-specific or sensitive settings (DB URL, secret keys, API keys)
see config.py / .env.
"""

# ── API ───────────────────────────────────────────────────────────────────────
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "UPSC Hindi Peer Network"

# ── Auth / JWT ────────────────────────────────────────────────────────────────
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  # 7 days

# ── Reputation / gamification points ─────────────────────────────────────────
POINTS_PER_UPVOTE = 10
POINTS_PER_ANSWER = 5
POINTS_PER_QUESTION = 2
POINTS_PER_STUDY_MINUTE = 1
POINTS_BEST_ANSWER = 25
POINTS_DOUBT_SOLVED = 15
POINTS_DAILY_SUBMISSION = 10
POINTS_MOCK_TEST_MAX = 50
CONTRIBUTOR_REPUTATION_THRESHOLD = 200
FLAWLESS_MIN_QUESTIONS = 50

# Level thresholds — each entry has a display rank name and the XP floor
LEVELS = [
    {"name": "Beginner", "rank": "Aspirant", "min_points": 0},
    {"name": "Learner", "rank": "Cadet", "min_points": 50},
    {"name": "Contributor", "rank": "Strategist", "min_points": 200},
    {"name": "Scholar", "rank": "Officer", "min_points": 500},
    {"name": "Mentor", "rank": "Senior Officer", "min_points": 1000},
]

# ── Current Affairs ingestion (Gemini free tier) ───────────────────────────────
# Free tier is ~15 RPM and limited daily requests — keep these conservative.
CA_INGESTION_MAX_AI_ARTICLES = 2        # max Gemini calls per ingestion run
CA_INGESTION_GEMINI_DELAY_SEC = 10      # pause between calls (free tier ~6 RPM)
CA_INGESTION_MAX_DESC_CHARS = 1200      # article excerpt sent to Gemini
CA_INGESTION_MAX_ARTICLE_CHARS = 5000   # max chars stored from fetched article body
CA_INGESTION_DEFAULT_GEMINI_MODEL = "gemini-2.0-flash-lite"
