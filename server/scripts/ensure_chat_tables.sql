-- Run in Supabase Dashboard → SQL Editor if chat history tables are missing.
-- Safe to run multiple times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL DEFAULT 'New chat',
    language VARCHAR(5) NOT NULL DEFAULT 'hi',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ai_chat_sessions_user_id ON ai_chat_sessions (user_id);

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
);

CREATE INDEX IF NOT EXISTS ix_ai_chat_messages_session_id ON ai_chat_messages (session_id);

-- Also ensure current affairs UPSC filter column exists:
ALTER TABLE current_affairs
    ADD COLUMN IF NOT EXISTS is_upsc_relevant BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE current_affairs
SET is_upsc_relevant = TRUE
WHERE gs_paper IS NOT NULL OR created_by IS NOT NULL;
