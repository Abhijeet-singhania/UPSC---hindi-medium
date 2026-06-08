import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, ExternalLink, Link2, Loader2, BookOpen, Sparkles, ChevronRight,
} from 'lucide-react';
import { parseAffairNotes } from '../../utils/formatAffairNotes';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const GS_COLORS = {
  GS1: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  GS2: 'bg-green-500/10 text-green-700 dark:text-green-400',
  GS3: 'bg-primary/10 text-primary',
  GS4: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  Essay: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
};
const gsColor = (gs) => GS_COLORS[gs] || 'bg-bg-surface text-text-muted';

const AnalysisSection = ({ notes, isArticle }) => {
  const { bullets, paragraphs } = parseAffairNotes(notes);

  return (
    <div className="bg-bg-panel border border-border-default rounded-xl p-6">
      <h2 className="font-serif text-[18px] font-semibold text-text-primary mb-1">
        {isArticle ? 'Article' : 'Analysis'}
      </h2>
      {!isArticle && (
        <p className="text-[12px] text-text-muted mb-4">Key points for aspirants</p>
      )}

      {bullets.length > 0 ? (
        <ul className="space-y-3 text-[14px] leading-[1.7] text-text-secondary list-none m-0 p-0">
          {bullets.map((point, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-primary font-bold shrink-0 mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-[14px] leading-[1.75] text-text-secondary whitespace-pre-wrap">
          {paragraphs.map((p, i) => (
            <p key={i} className={i > 0 ? 'mt-4' : ''}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
};

const RelatedSection = ({ affairId }) => {
  const navigate = useNavigate();
  const [related, setRelated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/v1/ai/related?source_type=affair&source_id=${affairId}&want=pyq,quiz&top_k=4`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.related) setRelated(data.related);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [affairId]);

  const hasPYQs = related?.pyqs?.length > 0;
  const hasQuizzes = related?.quizzes?.length > 0;

  if (loading) return null;
  if (!hasPYQs && !hasQuizzes) return null;

  return (
    <div className="bg-bg-panel border border-border-default rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={15} className="text-primary" />
        <h2 className="font-serif text-[16px] font-semibold text-text-primary">AI-Connected Study Material</h2>
        <span className="text-[10px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded">
          Semantic match
        </span>
      </div>

      {hasPYQs && (
        <div className="mb-4">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Related Past Year Questions</div>
          <div className="flex flex-col gap-2">
            {related.pyqs.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate('/prelims')}
                className="flex items-start justify-between gap-3 p-3 bg-bg-surface border border-border-default rounded-lg hover:border-primary/40 hover:bg-primary/5 transition text-left cursor-pointer w-full"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary line-clamp-2">{item.title}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {item.year && <span className="text-[10px] text-text-muted">{item.year}</span>}
                    {item.exam_type && <span className="text-[10px] text-text-muted capitalize">{item.exam_type}</span>}
                    {item.paper && <span className="text-[10px] text-primary">{item.paper}</span>}
                  </div>
                </div>
                <ChevronRight size={14} className="text-text-muted shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {hasQuizzes && (
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Related Quiz Questions</div>
          <div className="flex flex-col gap-2">
            {related.quizzes.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate('/prelims')}
                className="flex items-start justify-between gap-3 p-3 bg-bg-surface border border-border-default rounded-lg hover:border-primary/40 hover:bg-primary/5 transition text-left cursor-pointer w-full"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary line-clamp-2">{item.title}</p>
                  {item.subject && (
                    <span className="text-[10px] text-primary mt-1 inline-block">{item.subject}</span>
                  )}
                </div>
                <ChevronRight size={14} className="text-text-muted shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

      {hasAnalysis && (
        <AnalysisSection
          notes={item.detailed_notes}
          isArticle={summarySameAsTitle}
        />
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

      {/* AI-connected related content (Phase 3) */}
      <RelatedSection affairId={id} />
    </div>
  );
};

export default AffairDetail;
