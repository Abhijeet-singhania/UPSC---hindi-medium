import os
from pydantic_settings import BaseSettings


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
    
    # Points Configuration
    POINTS_PER_UPVOTE: int = 10
    POINTS_PER_ANSWER: int = 5
    POINTS_PER_QUESTION: int = 2
    POINTS_PER_STUDY_MINUTE: int = 1
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
