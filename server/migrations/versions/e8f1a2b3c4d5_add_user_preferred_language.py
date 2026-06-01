"""add preferred_language to users

Revision ID: e8f1a2b3c4d5
Revises: d670474557db
Create Date: 2026-05-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e8f1a2b3c4d5"
down_revision: Union[str, None] = "d670474557db"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("preferred_language", sa.String(length=5), nullable=False, server_default="hi"),
    )


def downgrade() -> None:
    op.drop_column("users", "preferred_language")
