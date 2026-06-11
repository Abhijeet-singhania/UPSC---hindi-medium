"""
Environment-specific and sensitive settings.

Values are loaded from environment variables / the .env file by pydantic-settings.
Non-sensitive app constants (points, algorithm, prefixes) live in constants.py.
"""
import warnings
from pydantic_settings import BaseSettings


_INSECURE_DEFAULT_KEY = "SPARTA"


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/upsc_hindi"

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://redis:6379/0"

    # ── Security ──────────────────────────────────────────────────────────────
    # Generate: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = _INSECURE_DEFAULT_KEY

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated origins. Use * for dev; explicit URLs in production.
    ALLOWED_ORIGINS: str = "*"

    # ── Demo data seeding ─────────────────────────────────────────────────────
    # Set to 1 in docker-compose (or .env) to seed demo accounts on first run.
    SEED_DEMO_DATA: str = "0"

    # ── Current Affairs automation ────────────────────────────────────────────
    # Free Gemini key: https://aistudio.google.com/app/apikey
    # Leave blank → AI processing skipped; raw RSS items saved for manual edit.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"
    # gemini-embedding-2 defaults to 3072 dims; we request GEMINI_EMBEDDING_DIM via API.
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-2"
    # Must match content_chunks.embedding VECTOR(n) in the database (currently 768).
    GEMINI_EMBEDDING_DIM: int = 768

    # Comma-separated RSS feed URLs ingested daily at 07:30 IST.
    RSS_FEEDS: str = (
        "https://www.thehindu.com/news/national/feeder/default.rss,"
        "https://pib.gov.in/RssMain.aspx,"
        "https://indianexpress.com/section/india/feed/"
    )

    # ── AI Tutor settings ─────────────────────────────────────────────────────
    # Max chunks returned per RAG query (top-k retrieval)
    AI_RETRIEVAL_TOP_K: int = 8
    # Max token budget for context passed to Gemini chat
    AI_CONTEXT_MAX_TOKENS: int = 6000
    # Chunk size for splitting long texts (in tokens, approx 4 chars each)
    AI_CHUNK_SIZE_TOKENS: int = 300
    AI_CHUNK_OVERLAP_TOKENS: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()

if settings.SECRET_KEY == _INSECURE_DEFAULT_KEY:
    warnings.warn(
        "SECURITY WARNING: SECRET_KEY is using the insecure default. "
        "Set a strong SECRET_KEY in your .env before deploying to production.",
        RuntimeWarning,
        stacklevel=2,
    )
