"""Shared pytest fixtures — SQLite test DB, FastAPI TestClient, auth helpers."""

import os
from pathlib import Path

# Force SQLite before app modules create the production engine
_test_db_path = Path(__file__).resolve().parent / "_pytest.db"
if _test_db_path.exists():
    _test_db_path.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{_test_db_path}"

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import router as api_router
from app.db.database import Base, get_db
from app.db import models  # noqa: F401
from app.db.models import User, UserRole
from app.services.auth_service import get_password_hash, create_access_token

# Single shared in-memory engine (StaticPool) for TestClient thread safety
engine = create_engine(
    os.environ["DATABASE_URL"],
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db():
    """Fresh schema per test; one shared SQLite file + StaticPool."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    """API client; each request gets the same test session (function-scoped)."""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app = FastAPI()
    app.include_router(api_router, prefix="/api/v1")
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def register_user(client, email: str, password: str = "Test123!", name: str = "Test User"):
    response = client.post(
        "/api/v1/users/register",
        json={"email": email, "password": password, "name": name},
    )
    assert response.status_code == 200, response.text
    return response.json()


def login_token(client, email: str, password: str = "Test123!") -> str:
    response = client.post(
        "/api/v1/users/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def user_pair(client):
    """Two registered users with bearer tokens."""
    register_user(client, "asker@test.dev", name="Asker")
    register_user(client, "helper@test.dev", name="Helper")
    return {
        "asker_token": login_token(client, "asker@test.dev"),
        "helper_token": login_token(client, "helper@test.dev"),
    }


@pytest.fixture()
def admin_user(db):
    """Admin user inserted directly (for pin / moderation tests)."""
    user = User(
        email="admin@test.dev",
        hashed_password=get_password_hash("Admin123!"),
        name="Admin",
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.email})
    return {"user": user, "token": token}
