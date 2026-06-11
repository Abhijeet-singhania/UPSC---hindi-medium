"""
SQLAlchemy engine and session factory.

Supports local Postgres (Docker) and Supabase (managed Postgres + pgvector).
For Supabase, set DATABASE_URL in .env to the Session pooler URI (port 5432).
"""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings


def _is_supabase_url(url: str) -> bool:
    return "supabase.co" in url or "supabase.com" in url


def _create_db_engine(*, pool_class=None):
    url = settings.DATABASE_URL
    connect_args: dict = {}
    engine_kwargs: dict = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    if pool_class is not None:
        engine_kwargs["poolclass"] = pool_class

    # Supabase requires SSL; auto-enable when host looks like Supabase
    ssl_mode = settings.DATABASE_SSL_MODE
    if ssl_mode == "auto":
        ssl_mode = "require" if _is_supabase_url(url) else "prefer"
    if ssl_mode and ssl_mode != "disable":
        connect_args["sslmode"] = ssl_mode

    # Transaction pooler (port 6543) — use Session pooler (5432) for SQLAlchemy when possible
    try:
        parsed = make_url(url)
        if parsed.port == 6543:
            import logging
            logging.getLogger(__name__).warning(
                "DATABASE_URL uses Supabase transaction pooler (port 6543). "
                "Prefer the Session pooler URI (port 5432) for SQLAlchemy."
            )
    except Exception:
        pass

    if connect_args:
        engine_kwargs["connect_args"] = connect_args

    return create_engine(url, **engine_kwargs)


engine = _create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
