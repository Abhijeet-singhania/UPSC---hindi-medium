-- Run once in Supabase Dashboard → SQL Editor before starting the API.
-- Enables vector search required for the AI / RAG layer.

CREATE EXTENSION IF NOT EXISTS vector;

-- Ask-AI chat history: paste contents of server/scripts/ensure_chat_tables.sql
-- Or run: docker exec upsc_api alembic upgrade head

-- Then run migrations from your machine or CI:
--   docker exec upsc_api alembic upgrade head
