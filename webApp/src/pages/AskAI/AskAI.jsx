import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowUp, BookOpen, Loader2, ExternalLink,
  Newspaper, FlaskConical, PenTool, GraduationCap,
} from 'lucide-react';
import { AiMessageContent } from '../../utils/formatAiMessage';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const SOURCE_META = {
  affair: { label: 'Current Affairs', icon: Newspaper, route: (id) => `/affairs/${id}` },
  pyq: { label: 'PYQ', icon: FlaskConical, route: () => '/prelims' },
  quiz: { label: 'Quiz', icon: FlaskConical, route: () => '/prelims' },
  daily_q: { label: 'Daily Q', icon: PenTool, route: () => '/answers' },
  ncert: { label: 'NCERT', icon: GraduationCap, route: () => '/content' },
};

const WELCOME = {
  role: 'ai',
  text: "Ask me anything about the UPSC syllabus, current affairs, or past year questions. I'll explain clearly and cite sources.",
  welcome: true,
};

const AskAI = () => {
  const { t } = useTranslation();
  const { token, user } = useSelector((state) => state.auth);

  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef();
  const inputRef = useRef();

  const hasConversation = messages.some((m) => m.role === 'user');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          language: user?.preferred_language || 'hi',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }

      const data = await res.json();

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

  const suggestions = [
    t('askAI.suggestions.quiz'),
    t('askAI.suggestions.cite'),
    t('askAI.suggestions.pyq'),
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] max-w-4xl mx-auto px-4 md:px-6 pb-4">
      {/* Header — compact once chatting */}
      <header className={`shrink-0 transition-all ${hasConversation ? 'py-3' : 'py-6 md:py-8'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <span className="text-[11px] tracking-widest text-primary font-semibold uppercase">
            {t('askAI.mentorMode')}
          </span>
        </div>
        {!hasConversation && (
          <>
            <h1 className="text-2xl md:text-[28px] font-serif text-text-primary leading-tight mt-2">
              {t('askAI.titlePrefix')}
              <span className="text-primary">{t('askAI.titleEm')}</span>
              {t('askAI.titleSuffix')}
            </h1>
            <p className="text-[13px] text-text-muted mt-2 max-w-xl leading-relaxed">
              {t('askAI.dek')}
            </p>
          </>
        )}
      </header>

      {/* Chat panel */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border-default bg-bg-panel/80 backdrop-blur-sm overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 md:py-6 space-y-6 [scrollbar-width:thin]">
          {messages.map((m, i) => (
            <MessageBlock key={i} m={m} t={t} />
          ))}
          <div ref={endRef} className="h-1" />
        </div>

        {/* Input dock */}
        <div className="shrink-0 border-t border-border-default bg-bg-base/90 px-4 md:px-5 py-4">
          {!hasConversation && (
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={isLoading}
                  className="text-[12px] text-text-secondary bg-bg-panel border border-border-default px-3.5 py-2 rounded-full hover:text-text-primary hover:border-primary/40 hover:bg-primary/5 transition cursor-pointer disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end bg-bg-panel border border-border-default rounded-2xl p-2 pl-4 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={t('askAI.inputPlaceholder')}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-text-primary placeholder:text-text-muted py-2.5 resize-none max-h-32 leading-relaxed"
              disabled={isLoading}
              style={{ minHeight: '44px' }}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              aria-label="Send"
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary-hover text-white rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
            </button>
          </div>

          {!token && (
            <p className="text-[11px] text-text-muted mt-2.5 text-center">
              <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link>
              {' '}to save your chat history and get personalised answers.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageBlock = ({ m, t }) => {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[75%] bg-primary text-white px-4 py-3 rounded-2xl rounded-br-md text-[14px] leading-relaxed shadow-sm">
          {m.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 md:gap-4 max-w-full">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={16} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {m.thinking ? (
          <ThinkingIndicator label={t('askAI.mentorThinking')} />
        ) : m.welcome ? (
          <div className="rounded-2xl border border-border-default bg-bg-base/60 px-5 py-4">
            <p className="text-[14px] leading-relaxed text-text-secondary">{m.text}</p>
          </div>
        ) : (
          <AiReplyCard m={m} t={t} />
        )}
      </div>
    </div>
  );
};

const ThinkingIndicator = ({ label }) => (
  <div className="rounded-2xl border border-border-default bg-bg-base/60 px-5 py-4">
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 bg-primary/70 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="text-[12px] text-text-muted">{label.replace('MENTOR · ', '')}</span>
    </div>
  </div>
);

const AiReplyCard = ({ m, t }) => {
  const sourcesRef = useRef(null);

  const scrollToCitation = useCallback((index) => {
    const el = document.getElementById(`cite-${index}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el?.classList.add('ring-2', 'ring-primary/50');
    setTimeout(() => el?.classList.remove('ring-2', 'ring-primary/50'), 1500);
  }, []);

  return (
    <article
      className={`rounded-2xl border overflow-hidden ${
        m.error
          ? 'border-red-400/30 bg-red-500/5'
          : m.blocked
            ? 'border-amber-400/30 bg-amber-500/5'
            : 'border-border-default bg-bg-base/60'
      }`}
    >
      {/* Answer body */}
      <div className="px-5 py-5 md:px-6 md:py-5">
        {m.error ? (
          <p className="text-[14px] text-red-400 leading-relaxed">{m.text}</p>
        ) : (
          <AiMessageContent text={m.text} onCitationClick={scrollToCitation} />
        )}
      </div>

      {/* Sources footer */}
      {!m.error && m.citations?.length > 0 && (
        <footer
          ref={sourcesRef}
          className="border-t border-border-default bg-bg-panel/50 px-5 py-4 md:px-6"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {t('askAI.citedKicker') || 'Sources'}
              </span>
            </div>
            {m.retrievedChunks > 0 && (
              <span className="text-[10px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded-full">
                {m.retrievedChunks} chunks retrieved
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {m.citations.map((c) => (
              <CitationCard key={`${c.source_type}-${c.source_id}`} citation={c} />
            ))}
          </div>
        </footer>
      )}
    </article>
  );
};

const CitationCard = ({ citation }) => {
  const meta = SOURCE_META[citation.source_type] || {
    label: citation.source_type,
    icon: BookOpen,
    route: () => '/',
  };
  const Icon = meta.icon;
  const title = citation.title || `${meta.label} #${citation.source_id}`;
  const href = meta.route(citation.source_id);
  const isLink = citation.source_type === 'affair';

  const inner = (
    <>
      <span className="shrink-0 w-6 h-6 rounded-md bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">
        {citation.index}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-text-muted uppercase tracking-wide">{meta.label}</div>
        <div className="text-[12px] text-text-primary font-medium truncate mt-0.5">{title}</div>
        {citation.gs_paper && (
          <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {citation.gs_paper}
          </span>
        )}
      </div>
      <Icon size={14} className="shrink-0 text-text-muted opacity-60" />
    </>
  );

  const cls =
    'flex items-center gap-2.5 p-2.5 rounded-xl border border-border-default bg-bg-base hover:border-primary/30 hover:bg-primary/5 transition group';

  if (isLink) {
    return (
      <Link
        id={`cite-${citation.index}`}
        to={href}
        className={`${cls} no-underline`}
      >
        {inner}
        <ExternalLink size={12} className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100 transition" />
      </Link>
    );
  }

  return (
    <div id={`cite-${citation.index}`} className={cls}>
      {inner}
    </div>
  );
};

export default AskAI;
