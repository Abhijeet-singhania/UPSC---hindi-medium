-- Run once in Supabase Dashboard → SQL Editor before starting the API.
-- Enables vector search required for the AI / RAG layer.

CREATE EXTENSION IF NOT EXISTS vector;

-- After this, run migrations from your machine or CI:
--   cd server && alembic upgrade head
