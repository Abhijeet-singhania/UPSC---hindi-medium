import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowUp, BookOpen, Loader2, ExternalLink,
  Newspaper, FlaskConical, PenTool, GraduationCap,
  Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft,
  SquarePen,
} from 'lucide-react';
import { AiMessageContent } from '../../utils/formatAiMessage';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const SOURCE_META = {
  affair:  { label: 'Current Affairs', icon: Newspaper,     route: (id) => `/affairs/${id}` },
  pyq:     { label: 'PYQ',             icon: FlaskConical,  route: () => '/prelims' },
  quiz:    { label: 'Quiz',            icon: FlaskConical,  route: () => '/prelims' },
  daily_q: { label: 'Daily Q',         icon: PenTool,       route: () => '/answers' },
  ncert:   { label: 'NCERT',           icon: GraduationCap, route: () => '/content' },
};

const WELCOME = {
  role: 'ai',
  text: "Ask me anything about the UPSC syllabus, current affairs, or past year questions. I'll explain clearly and cite sources.",
  welcome: true,
};

const apiHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const mapApiMessage = (m) => ({
  role: m.role === 'user' ? 'user' : 'ai',
  text: m.content,
  citations: m.citations || [],
  retrievedChunks: m.retrieved_chunks ?? 0,
  blocked: m.blocked,
  error: m.error,
});

/* Prompt suggestions shown on the empty state */
const SUGGESTION_GROUPS = [
  { icon: '📜', text: 'Explain the Preamble of the Indian Constitution' },
  { icon: '🌐', text: 'What is the importance of Westphalian sovereignty for GS2?' },
  { icon: '📊', text: 'Compare Keynesian vs Monetarist economics for GS3' },
  { icon: '⚖️', text: 'Explain ethical dilemmas in public service for GS4' },
  { icon: '🗺️', text: 'What are major river interlinking projects in India?' },
  { icon: '📰', text: 'Summarise recent changes in India–China relations' },
];

const AskAI = () => {
  const { t } = useTranslation();
  const { token, user } = useSelector((state) => state.auth);

  const [sessions, setSessions]               = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages]               = useState([WELCOME]);
  const [input, setInput]                     = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingHistory, setLoadingHistory]   = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const [inputFocused, setInputFocused]       = useState(false);
  const endRef   = useRef();
  const inputRef = useRef();

  const hasConversation = messages.some((m) => m.role === 'user');

  /* ── Data loading ── */
  const loadSessions = useCallback(async () => {
    if (!token) return;
    setLoadingSessions(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/sessions?limit=50`, { headers: apiHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch { setSessions([]); }
    finally { setLoadingSessions(false); }
  }, [token]);

  const loadSession = useCallback(async (sessionId) => {
    if (!token || !sessionId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/sessions/${sessionId}`, { headers: apiHeaders(token) });
      if (!res.ok) throw new Error('Failed to load chat');
      const data = await res.json();
      const msgs = (data.messages || []).map(mapApiMessage);
      setMessages(msgs.length ? msgs : [WELCOME]);
      setActiveSessionId(sessionId);
    } catch { setMessages([WELCOME]); }
    finally { setLoadingHistory(false); }
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading, loadingHistory]);

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([WELCOME]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm(t('askAI.deleteConfirm', 'Delete this chat?'))) return;
    try {
      await fetch(`${API_BASE}/api/v1/ai/sessions/${sessionId}`, { method: 'DELETE', headers: apiHeaders(token) });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) startNewChat();
    } catch { /* ignore */ }
  };

  const send = async (textOverride) => {
    const userMessage = (textOverride ?? input).trim();
    if (!userMessage || isLoading) return;
    setInput('');

    setMessages((prev) => [
      ...prev.filter((m) => !m.welcome),
      { role: 'user', text: userMessage },
      { role: 'ai', text: '', thinking: true, citations: [] },
    ]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/chat`, {
        method: 'POST',
        headers: apiHeaders(token),
        body: JSON.stringify({
          message: userMessage,
          session_id: activeSessionId,
          language: user?.preferred_language || 'hi',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err.detail;
        throw new Error(typeof detail === 'string' ? detail : `Error ${res.status}`);
      }

      const data = await res.json();
      if (data.session_id && data.session_id !== activeSessionId) setActiveSessionId(data.session_id);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'ai',
          text: data.answer || 'No response from AI.',
          thinking: false,
          citations: data.citations || [],
          retrievedChunks: data.retrieved_chunks ?? 0,
          blocked: data.blocked === true,
        };
        return updated;
      });

      loadSessions();
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'ai',
          text: err.message || 'Something went wrong. Please try again.',
          thinking: false,
          error: true,
          citations: [],
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  /* ── Auto-resize textarea ── */
  const handleInput = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  };

  return (
    <div
      className="flex h-[calc(100vh-72px)]"
      style={{ margin: '-32px', overflow: 'hidden' }}
    >
      {/* ══════════════════════════════════════════
          SESSION SIDEBAR
      ══════════════════════════════════════════ */}
      <aside
        className="hidden md:flex flex-col shrink-0 overflow-hidden transition-all duration-300"
        style={{
          width: sidebarOpen ? '240px' : '0px',
          borderRight: sidebarOpen ? '1px solid var(--border-default)' : 'none',
          background: 'var(--bg-base)',
        }}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >Chats</span>
          <button
            type="button"
            onClick={startNewChat}
            title="New chat"
            className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all hover:opacity-80"
            style={{ background: 'rgba(196,144,42,0.1)', color: '#C4902A', border: '1px solid rgba(196,144,42,0.2)' }}
          >
            <SquarePen size={13} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : sessions.length === 0 ? (
            <p
              className="text-center py-8 px-3 leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-muted)' }}
            >
              {t('askAI.noSessions', 'Your conversations will appear here')}
            </p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSession(s.id)}
                className="group w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer"
                style={{
                  background: activeSessionId === s.id ? 'rgba(196,144,42,0.08)' : 'transparent',
                  border: activeSessionId === s.id ? '1px solid rgba(196,144,42,0.18)' : '1px solid transparent',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => { if (activeSessionId !== s.id) e.currentTarget.style.background = 'rgba(196,144,42,0.04)'; }}
                onMouseLeave={e => { if (activeSessionId !== s.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <MessageSquare
                  size={13}
                  className="shrink-0 mt-0.5"
                  style={{ color: activeSessionId === s.id ? '#C4902A' : 'var(--text-muted)' }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="truncate"
                    style={{ fontSize: '13px', color: activeSessionId === s.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeSessionId === s.id ? 500 : 400 }}
                  >{s.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {s.message_count} {t('askAI.messages', 'messages')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => deleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                  aria-label="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CHAT AREA
      ══════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col relative" style={{ background: 'var(--bg-base)', minWidth: 0 }}>

        {/* Topbar row */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(196,144,42,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden md:flex p-1.5 rounded-lg cursor-pointer transition-all"
              style={{ color: 'var(--text-muted)', background: 'transparent', border: '1px solid rgba(196,144,42,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(196,144,42,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
            </button>

            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(196,144,42,0.2) 0%, rgba(196,144,42,0.06) 100%)', border: '1px solid rgba(196,144,42,0.2)' }}
              >
                <Sparkles size={14} style={{ color: '#C4902A' }} />
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {t('askAI.mentorMode', 'UPSC Mentor')}
              </span>
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'rgba(196,144,42,0.1)',
                  color: '#C4902A',
                  border: '1px solid rgba(196,144,42,0.2)',
                }}
              >
                AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-[12px] font-medium"
              style={{
                color: 'var(--text-secondary)',
                background: 'rgba(196,144,42,0.05)',
                border: '1px solid rgba(196,144,42,0.12)',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C4902A'; e.currentTarget.style.borderColor = 'rgba(196,144,42,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(196,144,42,0.12)'; }}
            >
              <Plus size={13} /> New chat
            </button>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto">
          {loadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={24} className="animate-spin" style={{ color: '#C4902A' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Loading conversation…</span>
              </div>
            </div>
          ) : !hasConversation ? (
            /* ── EMPTY STATE ── */
            <EmptyState send={send} t={t} />
          ) : (
            /* ── MESSAGE THREAD ── */
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-0">
              {messages.filter(m => !m.welcome).map((m, i) => (
                <MessageBlock key={i} m={m} t={t} />
              ))}
              {isLoading && messages[messages.length - 1]?.thinking && (
                <ThinkingRow />
              )}
              <div ref={endRef} className="h-4" />
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div
          className="shrink-0 px-4 md:px-6 pb-5 pt-3"
          style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border-muted)' }}
        >
          {/* Suggestion chips — only on empty state */}
          {!hasConversation && !loadingHistory && (
            <div className="flex flex-wrap gap-2 justify-center mb-3 max-w-3xl mx-auto">
              {SUGGESTION_GROUPS.slice(0, 3).map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => send(s.text)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] cursor-pointer transition-all disabled:opacity-50"
                  style={{
                    background: 'rgba(196,144,42,0.06)',
                    border: '1px solid rgba(196,144,42,0.14)',
                    color: 'var(--text-secondary)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,144,42,0.12)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(196,144,42,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,144,42,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(196,144,42,0.14)'; }}
                >
                  <span>{s.icon}</span> {s.text}
                </button>
              ))}
            </div>
          )}

          {/* Input box */}
          <div
            className="max-w-3xl mx-auto rounded-2xl transition-all duration-200"
            style={{
              background: 'var(--bg-surface)',
              border: inputFocused
                ? '1px solid rgba(196,144,42,0.45)'
                : '1px solid rgba(196,144,42,0.18)',
              boxShadow: inputFocused
                ? '0 0 0 4px rgba(196,144,42,0.08), 0 4px 24px rgba(0,0,0,0.2)'
                : '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={t('askAI.inputPlaceholder', 'Ask about the UPSC syllabus, PYQs, current affairs…')}
              className="w-full bg-transparent border-none outline-none resize-none leading-relaxed pt-4 pb-2 px-5"
              disabled={isLoading || loadingHistory}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                color: 'var(--text-primary)',
                minHeight: '52px',
                maxHeight: '180px',
              }}
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                {input.trim() ? 'Shift+Enter for new line' : 'Ask about History, Polity, Economy, Ethics…'}
              </span>
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || isLoading || loadingHistory}
                aria-label="Send"
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                style={{
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)'
                    : 'rgba(196,144,42,0.1)',
                  color: input.trim() && !isLoading ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(196,144,42,0.3)' : 'none',
                }}
              >
                {isLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <ArrowUp size={16} strokeWidth={2.5} />
                }
              </button>
            </div>
          </div>

          <p
            className="text-center mt-2"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'var(--text-muted)', opacity: 0.6 }}
          >
            AI can make mistakes. Always verify with official UPSC sources.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
    EMPTY / WELCOME STATE
══════════════════════════════════════════ */
const EmptyState = ({ send, t }) => (
  <div className="flex flex-col items-center justify-center h-full px-4 pb-8 pt-4">
    {/* Orb logo */}
    <div className="relative mb-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(196,144,42,0.2) 0%, rgba(196,144,42,0.06) 100%)',
          border: '1px solid rgba(196,144,42,0.25)',
          boxShadow: '0 0 40px rgba(196,144,42,0.12)',
        }}
      >
        <Sparkles size={28} style={{ color: '#C4902A' }} />
      </div>
      <div
        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: '#C4902A', boxShadow: '0 0 10px rgba(196,144,42,0.6)' }}
      >
        <span style={{ fontSize: '9px', color: '#fff', fontWeight: 700 }}>AI</span>
      </div>
    </div>

    <h2
      className="mb-2 text-center"
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(24px, 4vw, 36px)',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: 'var(--text-primary)',
      }}
    >
      {t('askAI.titlePrefix', 'What can I ')}
      <span style={{ background: 'linear-gradient(135deg, #E8BC5A 0%, #C4902A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {t('askAI.titleEm', 'help you master')}
      </span>
      {t('askAI.titleSuffix', ' today?')}
    </h2>

    <p
      className="mb-8 text-center max-w-md"
      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}
    >
      {t('askAI.dek', 'Trained on UPSC syllabus, NCERTs, PYQs, and current affairs. I cite every claim.')}
    </p>

    {/* Suggestion cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl">
      {SUGGESTION_GROUPS.map((s) => (
        <button
          key={s.text}
          type="button"
          onClick={() => send(s.text)}
          className="group flex items-start gap-3 p-4 rounded-xl text-left cursor-pointer transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(196,144,42,0.1)',
            boxShadow: 'var(--shadow-card)',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(196,144,42,0.28)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(196,144,42,0.1)';
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          }}
        >
          <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {s.text}
          </span>
        </button>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════
    THINKING ROW (streaming dots)
══════════════════════════════════════════ */
const ThinkingRow = () => (
  <div className="flex gap-4 py-5">
    <AiAvatar />
    <div className="flex items-center gap-1.5 pt-1.5">
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="rounded-full"
          style={{
            width: '6px',
            height: '6px',
            background: '#C4902A',
            opacity: 0.7,
            animation: 'aiPulse 1.4s ease-in-out infinite',
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes aiPulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  </div>
);

/* ══════════════════════════════════════════
    MESSAGE BLOCK
══════════════════════════════════════════ */
const AiAvatar = () => (
  <div
    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
    style={{
      background: 'linear-gradient(135deg, rgba(196,144,42,0.2) 0%, rgba(196,144,42,0.06) 100%)',
      border: '1px solid rgba(196,144,42,0.2)',
    }}
  >
    <Sparkles size={14} style={{ color: '#C4902A' }} />
  </div>
);

const MessageBlock = ({ m, t }) => {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end py-3">
        <div
          className="max-w-[80%] lg:max-w-[65%] px-5 py-3 rounded-2xl rounded-br-md text-[14px] leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)',
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 4px 16px rgba(196,144,42,0.25)',
          }}
        >
          {m.text}
        </div>
      </div>
    );
  }

  /* AI message */
  return (
    <div className="flex gap-4 py-5 group">
      <AiAvatar />
      <div className="flex-1 min-w-0 space-y-4 max-w-2xl">
        {m.thinking ? null /* handled by ThinkingRow */ : m.welcome ? (
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif" }}>
            {m.text}
          </p>
        ) : (
          <AiReplyContent m={m} t={t} />
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
    AI REPLY — no card border, just text
══════════════════════════════════════════ */
const AiReplyContent = ({ m, t }) => {
  const scrollToCitation = useCallback((index) => {
    const el = document.getElementById(`cite-${index}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el?.classList.add('ring-2', 'ring-primary/50');
    setTimeout(() => el?.classList.remove('ring-2', 'ring-primary/50'), 1500);
  }, []);

  if (m.error) {
    return (
      <div
        className="px-4 py-3 rounded-xl text-[14px]"
        style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {m.text}
      </div>
    );
  }

  if (m.blocked) {
    return (
      <div
        className="px-4 py-3 rounded-xl text-[14px]"
        style={{
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.2)',
          color: '#fbbf24',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {m.text}
      </div>
    );
  }

  return (
    <div>
      {/* Main response text */}
      <AiMessageContent text={m.text} onCitationClick={scrollToCitation} />

      {/* Citations section */}
      {m.citations?.length > 0 && (
        <div
          className="mt-5 pt-4 rounded-xl p-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(196,144,42,0.1)',
            marginTop: '20px',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={13} style={{ color: '#C4902A' }} />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {t('askAI.citedKicker') || 'Sources'}
              </span>
            </div>
            {m.retrievedChunks > 0 && (
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  background: 'rgba(196,144,42,0.06)',
                  border: '1px solid rgba(196,144,42,0.1)',
                }}
              >
                {m.retrievedChunks} chunks
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {m.citations.map((c) => (
              <CitationCard key={`${c.source_type}-${c.source_id}`} citation={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
    CITATION CARD
══════════════════════════════════════════ */
const CitationCard = ({ citation }) => {
  const meta = SOURCE_META[citation.source_type] || { label: citation.source_type, icon: BookOpen, route: () => '/' };
  const Icon = meta.icon;
  const title = citation.title || `${meta.label} #${citation.source_id}`;
  const href = meta.route(citation.source_id);
  const isLink = citation.source_type === 'affair';

  const inner = (
    <>
      <span
        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold"
        style={{ background: 'rgba(196,144,42,0.12)', color: '#C4902A', border: '1px solid rgba(196,144,42,0.2)' }}
      >
        {citation.index}
      </span>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{meta.label}</div>
        <div className="truncate" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '1px' }}>{title}</div>
        {citation.gs_paper && (
          <span
            className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: 'rgba(196,144,42,0.1)', color: '#C4902A' }}
          >
            {citation.gs_paper}
          </span>
        )}
      </div>
      <Icon size={13} className="shrink-0 opacity-40" style={{ color: 'var(--text-muted)' }} />
    </>
  );

  const cls = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid rgba(196,144,42,0.1)',
    background: 'var(--bg-base)',
    cursor: isLink ? 'pointer' : 'default',
    textDecoration: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  };

  if (isLink) {
    return (
      <Link
        id={`cite-${citation.index}`}
        to={href}
        style={cls}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,144,42,0.25)'; e.currentTarget.style.background = 'rgba(196,144,42,0.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,144,42,0.1)'; e.currentTarget.style.background = 'var(--bg-base)'; }}
      >
        {inner}
        <ExternalLink size={11} style={{ color: 'var(--text-muted)', opacity: 0.5, flexShrink: 0 }} />
      </Link>
    );
  }

  return (
    <div id={`cite-${citation.index}`} style={cls}>
      {inner}
    </div>
  );
};

export default AskAI;
