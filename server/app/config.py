import os
import warnings
from pydantic_settings import BaseSettings

_INSECURE_DEFAULT_KEY = "SPARTA"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@db:5432/upsc_hindi"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "UPSC Hindi Peer Network"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", _INSECURE_DEFAULT_KEY)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # CORS — comma-separated list of allowed origins; "*" allows all (dev only)
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")

    # Points Configuration
    POINTS_PER_UPVOTE: int = 10
    POINTS_PER_ANSWER: int = 5
    POINTS_PER_QUESTION: int = 2
    POINTS_PER_STUDY_MINUTE: int = 1
    POINTS_BEST_ANSWER: int = 25
    POINTS_DOUBT_SOLVED: int = 15
    POINTS_DAILY_SUBMISSION: int = 10
    CONTRIBUTOR_REPUTATION_THRESHOLD: int = 200

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

if settings.SECRET_KEY == _INSECURE_DEFAULT_KEY:
    warnings.warn(
        "SECURITY WARNING: SECRET_KEY is set to the insecure default 'SPARTA'. "
        "Set the SECRET_KEY environment variable before deploying to production.",
        RuntimeWarning,
        stacklevel=2,
    )
