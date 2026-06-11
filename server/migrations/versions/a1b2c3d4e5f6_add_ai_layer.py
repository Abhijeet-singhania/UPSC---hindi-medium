"""add AI layer: content_chunks table + ai scoring columns on daily_answers

Revision ID: a1b2c3d4e5f6
Revises: f3a8b2c1d4e5
Create Date: 2026-06-05

Adds:
  - pgvector extension
  - content_chunks table (universal semantic index)
  - ai_score_* and ai_feedback columns on daily_answers
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f3a8b2c1d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_columns(bind, table: str) -> set[str]:
    return {c["name"] for c in sa.inspect(bind).get_columns(table)}


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = set(insp.get_table_names())

    if "content_chunks" in tables:
        # create_all() may have already created the table — ensure HNSW index exists
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_content_chunks_embedding_hnsw "
            "ON content_chunks USING hnsw (embedding vector_cosine_ops)"
        )
    else:
        # content_chunks — universal RAG index
        op.create_table(
            "content_chunks",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("source_type", sa.String(length=20), nullable=False),
            sa.Column("source_id", sa.Integer(), nullable=False),
            sa.Column("chunk_index", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("chunk_text", sa.Text(), nullable=False),
            sa.Column("token_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("content_hash", sa.String(length=64), nullable=False),
            sa.Column("language", sa.String(length=5), nullable=True),
            sa.Column("gs_paper", sa.String(length=30), nullable=True),
            sa.Column("subject", sa.String(length=100), nullable=True),
            sa.Column("title", sa.String(length=400), nullable=True),
            sa.Column("metadata_json", sa.Text(), nullable=True),
            sa.Column("embedding", sa.Text(), nullable=True),  # placeholder; altered below
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_content_chunks_source_type", "content_chunks", ["source_type"])
        op.create_index("ix_content_chunks_source_id", "content_chunks", ["source_id"])
        op.create_index("ix_content_chunks_content_hash", "content_chunks", ["content_hash"])
        op.create_index("ix_content_chunks_language", "content_chunks", ["language"])
        op.create_index("ix_content_chunks_gs_paper", "content_chunks", ["gs_paper"])
        op.create_index("ix_content_chunks_subject", "content_chunks", ["subject"])

        # Replace placeholder embedding column with proper VECTOR type
        op.execute(
            "ALTER TABLE content_chunks ALTER COLUMN embedding TYPE vector(768) "
            "USING NULL::vector(768)"
        )

        # HNSW index for fast approximate nearest-neighbour search (cosine distance)
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_content_chunks_embedding_hnsw "
            "ON content_chunks USING hnsw (embedding vector_cosine_ops)"
        )

    # AI scoring columns on daily_answers (Phase 5)
    if "daily_answers" in tables:
        da_cols = _table_columns(bind, "daily_answers")
        if "ai_score_content" not in da_cols:
            op.add_column("daily_answers", sa.Column("ai_score_content", sa.Integer(), nullable=True))
        if "ai_score_structure" not in da_cols:
            op.add_column("daily_answers", sa.Column("ai_score_structure", sa.Integer(), nullable=True))
        if "ai_score_language" not in da_cols:
            op.add_column("daily_answers", sa.Column("ai_score_language", sa.Integer(), nullable=True))
        if "ai_feedback" not in da_cols:
            op.add_column("daily_answers", sa.Column("ai_feedback", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("daily_answers", "ai_feedback")
    op.drop_column("daily_answers", "ai_score_language")
    op.drop_column("daily_answers", "ai_score_structure")
    op.drop_column("daily_answers", "ai_score_content")
    op.drop_index("ix_content_chunks_embedding_hnsw", table_name="content_chunks")
    op.drop_table("content_chunks")
