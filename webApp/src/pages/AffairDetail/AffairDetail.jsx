import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, ExternalLink, Link2, Loader2, BookOpen,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const GS_COLORS = {
  GS1: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  GS2: 'bg-green-500/10 text-green-700 dark:text-green-400',
  GS3: 'bg-primary/10 text-primary',
  GS4: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  Essay: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
};
const gsColor = (gs) => GS_COLORS[gs] || 'bg-bg-surface text-text-muted';

const AffairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/v1/affairs/${id}`);
        if (!res.ok) throw new Error(res.status === 404 ? 'Article not found.' : 'Failed to load.');
        setItem(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted">
        <Loader2 size={22} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <BookOpen size={40} className="text-text-muted opacity-40" />
        <p className="text-text-muted text-[15px]">{error}</p>
        <button
          onClick={() => navigate('/affairs')}
          className="text-primary text-[13px] flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none"
        >
          <ArrowLeft size={14} /> Back to Current Affairs
        </button>
      </div>
    );
  }

  const tags = item.subject_tags
    ? item.subject_tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const summarySameAsTitle = item.summary?.trim() === item.title?.trim();
  const hasAnalysis = Boolean(item.detailed_notes?.trim());

  return (
    <div className="max-w-[780px] mx-auto flex flex-col gap-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/affairs')}
        className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-primary transition cursor-pointer bg-transparent border-none p-0 self-start"
      >
        <ArrowLeft size={14} /> Current Affairs
      </button>

      {/* Header */}
      <div>
        {item.gs_paper && (
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide ${gsColor(item.gs_paper)}`}>
            {item.gs_paper}
          </span>
        )}
        <h1 className="font-serif text-[28px] font-semibold text-text-primary leading-snug mt-3">
          {item.title}
        </h1>
        <div className="flex items-center gap-4 mt-2 text-[12px] text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {item.published_date}
          </span>
          {item.source_name && <span>· {item.source_name}</span>}
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink size={11} /> Source
            </a>
          )}
        </div>
      </div>

      {/* Summary — hide when it duplicates the headline */}
      {!summarySameAsTitle && (
        <div className="bg-bg-panel border border-border-default rounded-xl p-6">
          <h2 className="font-serif text-[16px] font-semibold text-text-primary mb-3">Summary</h2>
          <p className="text-[15px] leading-[1.7] text-text-primary">{item.summary}</p>
        </div>
      )}

      {/* Full article / analysis */}
      {hasAnalysis && (
        <div className="bg-bg-panel border border-border-default rounded-xl p-6">
          <h2 className="font-serif text-[18px] font-semibold text-text-primary mb-4">
            {summarySameAsTitle ? 'Article' : 'Analysis'}
          </h2>
          <div className="text-[14px] leading-[1.75] text-text-secondary whitespace-pre-wrap">
            {item.detailed_notes}
          </div>
        </div>
      )}

      {/* Fallback when only headline was stored (legacy ingests) */}
      {summarySameAsTitle && !hasAnalysis && (
        <div className="bg-bg-panel border border-border-default rounded-xl p-6 text-center">
          <p className="text-[14px] text-text-muted mb-4">
            Full article text was not captured during import. Open the original source below.
          </p>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary text-[13px] font-medium hover:underline"
            >
              <ExternalLink size={14} /> Read on {item.source_name || 'source site'}
            </a>
          )}
        </div>
      )}

      {/* Syllabus links */}
      {item.syllabus_links && (
        <div className="bg-primary/5 border-l-[3px] border-l-primary p-4 px-5 rounded-lg">
          <div className="text-[10px] text-primary font-bold tracking-[1px] uppercase mb-1 flex items-center gap-1">
            <Link2 size={11} /> Syllabus Connection
          </div>
          <p className="text-[13px] text-text-secondary">{item.syllabus_links}</p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {tags.map(tag => (
            <span
              key={tag}
              className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2.5 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AffairDetail;
