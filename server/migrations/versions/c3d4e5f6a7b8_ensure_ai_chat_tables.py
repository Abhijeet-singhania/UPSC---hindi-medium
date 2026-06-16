"""ensure ai chat tables exist (idempotent for Supabase)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-16

Safe to run when b2c3d4e5f6a7 was stamped but tables were never created.
Uses raw SQL — no PostgreSQL ENUM type (role stored as VARCHAR).
"""
from typing import Sequence, Union

from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_chat_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            title VARCHAR(255) NOT NULL DEFAULT 'New chat',
            language VARCHAR(5) NOT NULL DEFAULT 'hi',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_ai_chat_sessions_user_id ON ai_chat_sessions (user_id)"
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_chat_messages (
            id SERIAL PRIMARY KEY,
            session_id INTEGER NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            citations_json TEXT,
            retrieved_chunks INTEGER,
            blocked BOOLEAN DEFAULT false,
            error BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_ai_chat_messages_session_id ON ai_chat_messages (session_id)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ai_chat_messages")
    op.execute("DROP TABLE IF EXISTS ai_chat_sessions")
