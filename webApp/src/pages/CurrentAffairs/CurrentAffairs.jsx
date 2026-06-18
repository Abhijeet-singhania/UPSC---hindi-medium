import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Loader2, ExternalLink, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppLanguage from '../../hooks/useAppLanguage';
import { Card, Badge, EmptyState, Reveal, PageHeader } from '../../components/ui';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const GS_BADGE = { GS1: 'gs1', GS2: 'gs2', GS3: 'gs3', GS4: 'gs4', Essay: 'primary' };

// ── Single affair card ───────────────────────────────────────────────────────
const AffairCard = ({ item, onNavigate, index }) => {
  const tags = item.subject_tags ? item.subject_tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const gsBadge = GS_BADGE[item.gs_paper] ?? 'default';

  return (
    <Reveal delay={(index % 5) * 0.05}>
      <Card hover className="p-6">
        <div className="flex justify-between items-start mb-2 gap-3">
          <h3
            className="font-serif text-[18px] font-semibold text-text-primary leading-snug flex-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => onNavigate(item.id)}
          >
            {item.title}
          </h3>
          {item.gs_paper && <Badge variant={gsBadge}>{item.gs_paper}</Badge>}
        </div>

        <p className="text-[14px] leading-[1.65] text-text-secondary mb-4">{item.summary}</p>

        {item.syllabus_links && (
          <div className="bg-primary/5 border-l-2 border-l-primary p-3 px-4 rounded-lg mb-4">
            <div className="text-[10px] text-primary font-semibold tracking-[1px] uppercase mb-1 flex items-center gap-1.5">
              <Link2 size={11} /> Connect the dots
            </div>
            <div className="text-[13px] text-text-muted">
              <strong className="text-text-primary font-medium">Links to: </strong>
              {item.syllabus_links}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {tags.map(tag => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-border-muted">
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
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={11} /> Source
              </a>
            )}
            <button
              onClick={() => onNavigate(item.id)}
              className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover transition-colors cursor-pointer bg-transparent border-none p-0 font-medium"
            >
              Read more <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </Card>
    </Reveal>
  );
};

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
      {/* Header */}
      <PageHeader
        title={t('currentAffairs.heroTitle')}
        subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · ${todayCount} today · ${totalCount} this month`}
      />

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
            <EmptyState
              icon={<BookOpen size={36} />}
              title="No current affairs published yet."
              subtitle="Admins can add items via the API."
            />
          ) : (
            items.map((item, i) => (
              <AffairCard key={item.id} item={item} index={i} onNavigate={id => navigate(`/affairs/${id}`)} />
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
            <EmptyState icon={<BookOpen size={36} />} title="No archived items yet." />
          ) : (
            archiveItems.map((item, i) => (
            <AffairCard key={item.id} item={item} index={i} onNavigate={id => navigate(`/affairs/${id}`)} />
          ))
          )}
        </div>
      )}
    </div>
  );
};

export default CurrentAffairs;
