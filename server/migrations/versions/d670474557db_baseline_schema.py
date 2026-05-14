"""baseline_schema

Revision ID: d670474557db
Revises:
Create Date: 2026-05-12

This is the baseline migration that represents the initial database schema
created via SQLAlchemy `create_all()`.

On a brand-new database: run `alembic upgrade head` to apply future migrations.
On an existing database that was created via `create_all()`:
  run `alembic stamp head` to mark this baseline as already applied,
  then use `alembic revision --autogenerate` for future changes.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd670474557db'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Baseline migration — no-op.
    The schema was originally created by SQLAlchemy create_all() on startup.
    For existing databases: use `alembic stamp head` instead of running upgrade.
    """
    pass


def downgrade() -> None:
    """Baseline — downgrade is a no-op."""
    pass
