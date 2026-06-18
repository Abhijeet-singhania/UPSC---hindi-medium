import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppLanguage from '../../hooks/useAppLanguage';
import { PenLine, Menu, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const ROUTE_META = {
  '/dashboard':  { titleKey: 'sidebar.dashboard' },
  '/roadmap':    { titleKey: 'sidebar.myRoadmap' },
  '/content':    { titleKey: 'sidebar.studyContent' },
  '/affairs':    { titleKey: 'sidebar.currentAffairs' },
  '/prelims':    { titleKey: 'sidebar.prelimsLab' },
  '/past-year':  { titleKey: 'sidebar.pastYearProblems', parent: { label: 'Prelims Lab', path: '/prelims' } },
  '/ask-ai':     { titleKey: 'sidebar.askAI' },
  '/answers':    { titleKey: 'sidebar.answerWriting' },
  '/rewards':    { titleKey: 'sidebar.rewards' },
  '/community':  { titleKey: 'sidebar.community' },
  '/wellbeing':  { titleKey: 'sidebar.wellbeing' },
  '/settings':   { titleKey: 'sidebar.settings' },
  '/admin':      { titleKey: 'common.admin' },
};

const Topbar = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { language } = useAppLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const meta = ROUTE_META[location.pathname] ?? { titleKey: 'sidebar.dashboard' };
  const title = t(meta.titleKey);

  // Build breadcrumb for affair detail pages: /affairs/:id
  const isAffairDetail = location.pathname.startsWith('/affairs/') && location.pathname !== '/affairs';

  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const today = new Date().toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header
      className="sticky top-0 z-[100] flex items-center justify-between py-3 px-6 backdrop-blur-md bg-bg-panel/90"
      style={{ borderBottom: '1px solid rgba(196,144,42,0.12)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-text-muted hover:text-text-primary transition-colors p-1 -ml-1 cursor-pointer"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb / title */}
        <div className="flex items-center gap-1.5 min-w-0">
          {meta.parent && (
            <>
              <Link
                to={meta.parent.path}
                className="text-text-muted hover:text-text-secondary text-[14px] transition-colors shrink-0"
              >
                {meta.parent.label}
              </Link>
              <ChevronRight size={13} className="text-text-muted shrink-0" />
            </>
          )}
          {isAffairDetail && (
            <>
              <Link
                to="/affairs"
                className="text-text-muted hover:text-text-secondary text-[14px] transition-colors shrink-0"
              >
                {t('sidebar.currentAffairs')}
              </Link>
              <ChevronRight size={13} className="text-text-muted shrink-0" />
            </>
          )}
          <h2
            className="leading-tight truncate"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}
          >
            {isAffairDetail ? 'Article' : title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="hidden sm:block font-mono text-text-muted text-[12px] tracking-wide">{today}</span>
        {location.pathname !== '/settings' && location.pathname !== '/answers' && (
          <button
            onClick={() => navigate('/answers')}
            className="border-none py-2 px-4 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <PenLine size={14} />
            <span className="hidden sm:inline">{t('roadmap.writeToday')}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
