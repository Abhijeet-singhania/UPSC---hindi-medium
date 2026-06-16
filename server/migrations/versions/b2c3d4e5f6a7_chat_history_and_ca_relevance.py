"""add ai chat history tables and is_upsc_relevant on current_affairs

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_message_role = sa.Enum("user", "assistant", name="aichatmessagerole")


def upgrade() -> None:
    op.execute(
        "ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS "
        "is_upsc_relevant BOOLEAN NOT NULL DEFAULT FALSE"
    )
    op.execute(
        "UPDATE current_affairs SET is_upsc_relevant = TRUE "
        "WHERE gs_paper IS NOT NULL OR created_by IS NOT NULL"
    )

    bind = op.get_bind()
    insp = sa.inspect(bind)
    if "ai_chat_sessions" not in insp.get_table_names():
        op.create_table(
            "ai_chat_sessions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False, server_default="New chat"),
            sa.Column("language", sa.String(length=5), nullable=False, server_default="hi"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_ai_chat_sessions_user_id", "ai_chat_sessions", ["user_id"])

    if "ai_chat_messages" not in insp.get_table_names():
        _message_role.create(bind, checkfirst=True)
        op.create_table(
            "ai_chat_messages",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("session_id", sa.Integer(), nullable=False),
            sa.Column("role", _message_role, nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("citations_json", sa.Text(), nullable=True),
            sa.Column("retrieved_chunks", sa.Integer(), nullable=True),
            sa.Column("blocked", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("error", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["session_id"], ["ai_chat_sessions.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_ai_chat_messages_session_id", "ai_chat_messages", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_ai_chat_messages_session_id", table_name="ai_chat_messages")
    op.drop_table("ai_chat_messages")
    _message_role.drop(op.get_bind(), checkfirst=True)
    op.drop_index("ix_ai_chat_sessions_user_id", table_name="ai_chat_sessions")
    op.drop_table("ai_chat_sessions")
    op.drop_column("current_affairs", "is_upsc_relevant")
