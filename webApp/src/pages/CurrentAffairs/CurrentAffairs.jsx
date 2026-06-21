import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Loader2, ExternalLink, BookOpen, Calendar, ArrowRight, Quote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppLanguage from '../../hooks/useAppLanguage';
import { Badge, EmptyState, Reveal, PageHeader } from '../../components/ui';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const GS_BADGE = { GS1: 'gs1', GS2: 'gs2', GS3: 'gs3', GS4: 'gs4', Essay: 'primary' };

// ── Editorial Hero Card ──────────────────────────────────────────────────────
const EditorialHero = ({ item, onNavigate }) => {
  const gsBadge = GS_BADGE[item.gs_paper] ?? 'default';
  
  return (
    <Reveal>
      <div 
        className="relative rounded-2xl overflow-hidden mb-8 cc-panel cursor-pointer group"
        onClick={() => onNavigate(item.id)}
      >
        {/* Subtle background texture/gradient for the hero */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg-surface to-bg-panel opacity-50"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
               <span className="text-primary text-[12px] font-bold tracking-widest uppercase flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                 Lead Story
               </span>
               {item.gs_paper && <Badge variant={gsBadge}>{item.gs_paper}</Badge>}
            </div>
            
            <h2 className="font-serif text-[32px] md:text-[42px] leading-[1.15] font-bold text-text-primary mb-6 group-hover:text-primary transition-colors">
              {item.title}
            </h2>
            
            <p className="text-[16px] leading-[1.7] text-text-secondary mb-6 font-serif italic">
              {item.summary}
            </p>

            <div className="flex items-center gap-4 text-[12px] text-text-muted mt-8 border-t border-border-default pt-4">
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {item.published_date}</span>
              {item.source_name && <span>· {item.source_name}</span>}
              <span className="flex items-center gap-1.5 text-primary ml-auto font-semibold">
                Read Full Briefing <ArrowRight size={13} />
              </span>
            </div>
          </div>
          
          {item.syllabus_links && (
            <div className="w-full md:w-[320px] shrink-0 cc-inset p-6 border-l-4 border-l-primary relative">
              <Quote size={32} className="absolute -top-3 -left-3 text-primary/20 bg-bg-panel rounded-full p-1" />
              <div className="text-[10px] text-primary font-bold tracking-[1.5px] uppercase mb-3 flex items-center gap-1.5">
                <Link2 size={12} /> Syllabus Connection
              </div>
              <div className="text-[14px] text-text-primary leading-relaxed font-serif">
                {item.syllabus_links}
              </div>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
};


// ── Editorial Column Card ────────────────────────────────────────────────────
const EditorialCard = ({ item, onNavigate, index }) => {
  const tags = item.subject_tags ? item.subject_tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const gsBadge = GS_BADGE[item.gs_paper] ?? 'default';

  return (
    <Reveal delay={(index % 5) * 0.05}>
      <div className="cc-panel p-6 h-full flex flex-col hover:cc-panel-hover transition-all cursor-pointer group" onClick={() => onNavigate(item.id)}>
        <div className="flex justify-between items-start mb-3 gap-3">
          {item.gs_paper && <Badge variant={gsBadge}>{item.gs_paper}</Badge>}
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            {item.published_date}
          </span>
        </div>

        <h3 className="font-serif text-[20px] font-bold text-text-primary leading-[1.25] mb-3 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        <p className="text-[13px] leading-[1.6] text-text-secondary mb-5 flex-1 font-serif line-clamp-4">
          {item.summary}
        </p>

        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {tags.slice(0, 3).map(tag => (
              <Badge key={tag} className="text-[9px] px-1.5 py-0.5">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-dashed border-border-default flex items-center justify-between">
           {item.source_name && <span className="text-[11px] text-text-muted italic">{item.source_name}</span>}
           <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={14} />
           </span>
        </div>
      </div>
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

  const renderEditorialGrid = (itemList) => {
    if (!itemList || itemList.length === 0) return null;
    
    const [heroItem, ...gridItems] = itemList;
    
    return (
      <div className="flex flex-col">
        {/* Lead Story */}
        <EditorialHero item={heroItem} onNavigate={id => navigate(`/affairs/${id}`)} />
        
        {/* Magazine Grid for remaining items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridItems.map((item, i) => (
            <EditorialCard key={item.id} item={item} index={i} onNavigate={id => navigate(`/affairs/${id}`)} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title={t('currentAffairs.heroTitle')}
        subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · ${todayCount} today · ${totalCount} this month`}
      />

      {/* Tabs */}
      <div className="cc-panel flex gap-8">
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
        <div className="flex flex-col gap-6">
          {/* GS filter */}
          <div className="flex gap-2 flex-wrap">
            {GS_OPTIONS.map(gs => (
              <button
                key={gs || 'all'}
                onClick={() => setGsFilter(gs)}
                className={`text-[11px] px-3 py-1.5 rounded-full font-semibold border transition-all cursor-pointer ${
                  gsFilter === gs
                    ? 'bg-primary text-white border-primary'
                    : 'cc-panel text-text-muted border-border-default hover:border-primary/50'
                }`}
              >
                {gs || t('common.allPapers')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-text-muted py-10 justify-center">
              <Loader2 size={18} className="animate-spin" /> Gathering the latest intelligence…
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
            renderEditorialGrid(items)
          )}
        </div>
      )}

      {/* Archive tab */}
      {activeTab === 'archive' && (
        <div className="flex flex-col gap-6">
          {archiveLoading ? (
            <div className="flex items-center gap-2 text-text-muted py-10 justify-center">
              <Loader2 size={18} className="animate-spin" /> Accessing archives…
            </div>
          ) : archiveItems.length === 0 ? (
            <EmptyState icon={<BookOpen size={36} />} title="No archived items yet." />
          ) : (
            renderEditorialGrid(archiveItems)
          )}
        </div>
      )}
    </div>
  );
};

export default CurrentAffairs;
