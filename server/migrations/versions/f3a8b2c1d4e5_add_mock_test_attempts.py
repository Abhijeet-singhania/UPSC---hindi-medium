"""add mock_test_attempts table

Revision ID: f3a8b2c1d4e5
Revises: e8f1a2b3c4d5
Create Date: 2026-05-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3a8b2c1d4e5"
down_revision: Union[str, None] = "e8f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "mock_test_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("exam_type", sa.String(length=20), nullable=False),
        sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("correct_count", sa.Integer(), nullable=True),
        sa.Column("wrong_count", sa.Integer(), nullable=True),
        sa.Column("unattempted_count", sa.Integer(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("percentage", sa.Integer(), nullable=True),
        sa.Column("time_used_seconds", sa.Integer(), nullable=True),
        sa.Column("points_awarded", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mock_test_attempts_id"), "mock_test_attempts", ["id"], unique=False)
    op.create_index(op.f("ix_mock_test_attempts_user_id"), "mock_test_attempts", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_mock_test_attempts_user_id"), table_name="mock_test_attempts")
    op.drop_index(op.f("ix_mock_test_attempts_id"), table_name="mock_test_attempts")
    op.drop_table("mock_test_attempts")
