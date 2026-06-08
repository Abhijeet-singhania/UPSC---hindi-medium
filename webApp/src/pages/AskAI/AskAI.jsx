import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Sparkles, ArrowRight, ExternalLink, BookOpen, Loader2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const SOURCE_TYPE_LABELS = {
  affair: 'Current Affairs',
  pyq: 'Past Year Question',
  quiz: 'Quiz Question',
  daily_q: 'Daily Question',
  ncert: 'NCERT',
};

const SOURCE_TYPE_ROUTES = {
  affair: (id) => `/affairs/${id}`,
  pyq: () => `/prelims`,
  quiz: () => `/prelims`,
  daily_q: () => `/answers`,
  ncert: () => `/content`,
};

const AskAI = () => {
  const { t } = useTranslation();
  const { token, user } = useSelector((state) => state.auth);

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Ask me anything about the UPSC syllabus, current affairs, or past year questions. I'll explain clearly and cite sources.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');

    setMessages((prev) => [
      ...prev,
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
    }
  };

  const suggestions = [
    t('askAI.suggestions.quiz'),
    t('askAI.suggestions.cite'),
    t('askAI.suggestions.pyq'),
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto px-4 md:px-6">
      <div className="py-6 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-primary" />
          <span className="text-[11px] tracking-[2px] text-primary font-bold uppercase">
            {t('askAI.mentorMode')}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif text-text-primary">
          {t('askAI.titlePrefix')}
          <em className="text-primary italic not-italic">{t('askAI.titleEm')}</em>
          {t('askAI.titleSuffix')}
        </h1>
        <p className="text-sm text-text-secondary mt-2">{t('askAI.dek')}</p>
      </div>

      <div className="flex-1 min-h-0 bg-bg-panel border border-border-default rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 [scrollbar-width:thin]">
          {messages.map((m, i) => (
            <Bubble key={i} m={m} t={t} />
          ))}
          <div ref={endRef} />
        </div>

        <div className="p-4 bg-bg-base border-t border-border-default">
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(s)}
                className="text-[11px] text-text-secondary bg-bg-panel border border-border-default px-3 py-1.5 rounded-lg hover:text-text-primary hover:border-border-strong transition cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center bg-bg-panel border border-border-default rounded-xl p-2 px-3 focus-within:border-border-strong transition">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={t('askAI.inputPlaceholder')}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-text-primary placeholder:text-text-muted py-2"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary-hover text-text-primary p-2.5 rounded-lg transition cursor-pointer disabled:opacity-40"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            </button>
          </div>
          {!token && (
            <p className="text-[11px] text-text-muted mt-2">
              <a href="/auth" className="text-primary hover:underline">Sign in</a> to use the AI mentor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Bubble = ({ m, t }) => {
  if (m.role === 'user') {
    return (
      <div className="self-end max-w-[85%] bg-primary/10 border border-primary/20 text-text-primary px-4 py-3 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed">
        {m.text}
      </div>
    );
  }

  return (
    <div className="self-start max-w-[90%] flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
        <Sparkles size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
          {m.thinking ? (
            <span className="flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> {t('askAI.mentorThinking')}
            </span>
          ) : (
            t('askAI.mentorReply')
          )}
        </div>

        {m.thinking ? (
          <div className="bg-bg-base border border-border-default px-4 py-3 rounded-2xl rounded-tl-sm">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        ) : (
          <div className={`bg-bg-base border rounded-2xl rounded-tl-sm px-4 py-3 ${m.error ? 'border-red-300/50' : 'border-border-default'}`}>
            <div className="text-[14px] leading-relaxed text-text-primary whitespace-pre-wrap">
              {m.text}
            </div>

            {/* Citations */}
            {m.citations && m.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border-default flex flex-col gap-1.5">
                <div className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1">
                  <BookOpen size={10} /> Sources
                </div>
                {m.citations.map((c) => (
                  <CitationChip key={`${c.source_type}-${c.source_id}`} citation={c} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CitationChip = ({ citation }) => {
  const label = SOURCE_TYPE_LABELS[citation.source_type] || citation.source_type;
  const routeFn = SOURCE_TYPE_ROUTES[citation.source_type];
  const route = routeFn ? routeFn(citation.source_id) : '/';
  const title = citation.title || `${label} #${citation.source_id}`;
  const isInternal = citation.source_type === 'affair';

  return (
    <a
      href={isInternal ? route : '#'}
      onClick={!isInternal ? (e) => e.preventDefault() : undefined}
      className="flex items-center gap-2 text-[11px] text-text-secondary hover:text-primary bg-bg-panel border border-border-default rounded-lg px-2.5 py-1.5 transition hover:border-border-strong no-underline"
    >
      <span className="text-primary font-bold shrink-0">[{citation.index}]</span>
      <span className="truncate max-w-[280px]">{title}</span>
      {citation.gs_paper && (
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
          {citation.gs_paper}
        </span>
      )}
      {isInternal && <ExternalLink size={10} className="shrink-0 text-text-muted" />}
    </a>
  );
};

export default AskAI;
