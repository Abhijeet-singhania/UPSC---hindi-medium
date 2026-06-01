import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Loader2, ExternalLink, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppLanguage from '../../hooks/useAppLanguage';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const GS_COLORS = {
  GS1: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  GS2: 'bg-green-500/10 text-green-700 dark:text-green-400',
  GS3: 'bg-primary/10 text-primary',
  GS4: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  Essay: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
};
const gsColor = (gs) => GS_COLORS[gs] || 'bg-bg-surface text-text-muted';

// ── Single affair card ───────────────────────────────────────────────────────
const AffairCard = ({ item, onNavigate }) => {
  const tags = item.subject_tags ? item.subject_tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-start mb-2 gap-3">
        <h3
          className="font-serif text-[18px] font-semibold text-text-primary leading-snug flex-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => onNavigate(item.id)}
        >
          {item.title}
        </h3>
        {item.gs_paper && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 uppercase ${gsColor(item.gs_paper)}`}>
            {item.gs_paper}
          </span>
        )}
      </div>

      <p className="text-[14px] leading-[1.6] text-text-primary mb-4">{item.summary}</p>

      {item.syllabus_links && (
        <div className="bg-primary/5 border-l-2 border-l-primary p-3 px-4 rounded mb-4">
          <div className="text-[10px] text-primary font-semibold tracking-[1px] uppercase mb-1 flex items-center gap-1">
            <Link2 size={12} /> Connect the dots
          </div>
          <div className="text-[13px] text-text-muted">
            <strong className="text-text-primary font-medium">Links to: </strong>
            {item.syllabus_links}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {tags.map(tag => (
            <span key={tag} className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-border-default">
        <span className="text-[11px] text-text-muted flex items-center gap-1">
          <Calendar size={11} /> {item.published_date}
          {item.source_name && <span className="ml-2">· {item.source_name}</span>}
        </span>
        <div className="flex items-center gap-3">
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-primary"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={11} /> Source
            </a>
          )}
          <button
            onClick={() => onNavigate(item.id)}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            Read more <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <BookOpen size={40} className="text-text-muted mb-4 opacity-40" />
    <p className="text-text-muted text-[14px]">{message}</p>
    <p className="text-text-muted text-[12px] mt-1 opacity-70">
      Admins can add items via the API.
    </p>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const CurrentAffairs = () => {
  const { t, contentLanguage } = useAppLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('digest');
  const [items, setItems] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Archive state
  const [archiveItems, setArchiveItems] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Filter state for digest
  const [gsFilter, setGsFilter] = useState('');

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: '30', language: contentLanguage });
      if (gsFilter) qs.set('gs_paper', gsFilter);
      const res = await fetch(`${API_BASE}/api/v1/affairs/?${qs}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(data.items || []);
      setTodayCount(data.today_count || 0);
      setTotalCount(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [gsFilter, contentLanguage]);

  const fetchArchive = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/affairs/archive?language=${contentLanguage}&limit=50`);
      if (!res.ok) throw new Error('Failed to load archive');
      const data = await res.json();
      setArchiveItems(data.items || []);
    } catch {
      setArchiveItems([]);
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'digest') fetchDigest();
    if (activeTab === 'archive') fetchArchive();
  }, [activeTab, fetchDigest, fetchArchive]);

  const GS_OPTIONS = ['', 'GS1', 'GS2', 'GS3', 'GS4', 'Essay'];
  const TABS = [
    { id: 'digest', label: t('currentAffairs.tabDigest') },
    { id: 'archive', label: t('currentAffairs.tabArchive') },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Stats */}
      <div className="bg-bg-surface-dark text-text-primary rounded-xl py-8 px-12 flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase tracking-[2px] text-text-muted mb-3">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h2 className="text-[28px] font-serif font-semibold mb-2">{t('currentAffairs.heroTitle')}</h2>
          <p className="text-[14px] text-text-secondary">{t('currentAffairs.heroSub')}</p>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[28px] font-serif text-[#FDFBF8]">{todayCount}</span>
            <span className="text-[10px] text-text-muted tracking-[1px] uppercase">{t('currentAffairs.statToday')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[28px] font-serif text-[#FDFBF8]">{totalCount}</span>
            <span className="text-[10px] text-text-muted tracking-[1px] uppercase">{t('currentAffairs.statMonth')}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-border-default">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer transition-colors ${
              activeTab === tab.id ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Digest tab */}
      {activeTab === 'digest' && (
        <div className="flex flex-col gap-4">
          {/* GS filter */}
          <div className="flex gap-2 flex-wrap">
            {GS_OPTIONS.map(gs => (
              <button
                key={gs || 'all'}
                onClick={() => setGsFilter(gs)}
                className={`text-[11px] px-3 py-1.5 rounded-full font-semibold border transition-all cursor-pointer ${
                  gsFilter === gs
                    ? 'bg-primary text-white border-primary'
                    : 'bg-bg-panel text-text-muted border-border-default hover:border-primary/50'
                }`}
              >
                {gs || t('common.allPapers')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-text-muted py-10 justify-center">
              <Loader2 size={18} className="animate-spin" /> Loading current affairs…
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm py-4">
              Could not load. Is the server running? ({error})
            </div>
          ) : items.length === 0 ? (
            <EmptyState message="No current affairs published yet." />
          ) : (
            items.map(item => (
              <AffairCard key={item.id} item={item} onNavigate={id => navigate(`/affairs/${id}`)} />
            ))
          )}
        </div>
      )}

      {/* Archive tab */}
      {activeTab === 'archive' && (
        <div className="flex flex-col gap-4">
          {archiveLoading ? (
            <div className="flex items-center gap-2 text-text-muted py-10 justify-center">
              <Loader2 size={18} className="animate-spin" /> Loading archive…
            </div>
          ) : archiveItems.length === 0 ? (
            <EmptyState message="No archived items yet." />
          ) : (
            archiveItems.map(item => (
            <AffairCard key={item.id} item={item} onNavigate={id => navigate(`/affairs/${id}`)} />
          ))
          )}
        </div>
      )}
    </div>
  );
};

export default CurrentAffairs;
