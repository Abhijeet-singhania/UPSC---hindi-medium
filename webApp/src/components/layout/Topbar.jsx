import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAppLanguage from '../../hooks/useAppLanguage';
import { PenLine, Menu, ChevronRight, Flame, Zap, Target, Sun, Moon, LogOut } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../store/slices/authSlice';

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

/* UPSC CSE Prelims 2027 — update this each cycle */
const EXAM_DATE = new Date('2027-05-25T00:00:00');

function useMiniCountdown(targetDate) {
  const [diff, setDiff] = useState(() => Math.max(0, targetDate - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, targetDate - Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const Topbar = () => {
  const { t } = useTranslation();
  const { language } = useAppLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { theme, toggleTheme } = useTheme();

  const meta = ROUTE_META[location.pathname] ?? { titleKey: 'sidebar.dashboard' };
  const title = t(meta.titleKey);
  const isAffairDetail = location.pathname.startsWith('/affairs/') && location.pathname !== '/affairs';

  const countdown = useMiniCountdown(EXAM_DATE);
  const streak = user?.streak_days ?? 0;
  const reputation = user?.reputation ?? 0;

  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const today = new Date().toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header
      className="sticky top-0 z-[100] flex items-center justify-between py-2.5 px-6"
      style={{
        background: 'var(--cc-panel-bg)',
        borderBottom: '1px solid var(--cc-panel-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: Page title + breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 pl-2">
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

      {/* Center: Mission Clock (hidden on small screens) */}
      <div className="hidden md:flex items-center gap-2">
        <span className="cc-pulse" />
        <div
          className="flex items-center gap-1.5 cc-mono text-[12px]"
          style={{ color: '#C4902A' }}
          title="UPSC CSE Prelims 2027"
        >
          <Target size={11} className="opacity-70" />
          <span className="font-bold">{countdown.days}</span>
          <span className="text-text-muted text-[9px] font-bold">D</span>
          <span className="font-bold">{String(countdown.hours).padStart(2, '0')}</span>
          <span className="text-text-muted text-[9px] font-bold">H</span>
          <span className="font-bold">{String(countdown.minutes).padStart(2, '0')}</span>
          <span className="text-text-muted text-[9px] font-bold">M</span>
          <span className="font-bold opacity-60">{String(countdown.seconds).padStart(2, '0')}</span>
          <span className="text-text-muted text-[9px] font-bold opacity-60">S</span>
        </div>
      </div>

      {/* Right: Status pills + date + CTA */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Status pills (hidden on small screens) */}
        {streak > 0 && (
          <span className="cc-status-pill hidden lg:inline-flex">
            <Flame size={12} style={{ color: '#C4902A', fill: '#C4902A' }} />
            <span style={{ color: '#C4902A', fontWeight: 700 }}>{streak}</span>
          </span>
        )}
        {reputation > 0 && (
          <span className="cc-status-pill hidden lg:inline-flex">
            <Zap size={11} style={{ color: '#3B6CC4' }} />
            <span style={{ color: '#3B6CC4', fontWeight: 700 }}>{reputation}</span>
            <span className="text-[9px] text-text-muted">XP</span>
          </span>
        )}

        <span className="hidden sm:block cc-mono text-text-muted text-[11px]">{today}</span>

        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-bg-panel transition-colors text-text-muted hover:text-primary"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button 
          onClick={() => {
            dispatch(logout());
            navigate('/auth');
          }}
          className="p-2 rounded-full hover:bg-bg-panel transition-colors text-text-muted hover:text-red-500"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={18} />
        </button>

        {location.pathname !== '/settings' && location.pathname !== '/answers' && (
          <button
            onClick={() => navigate('/answers')}
            className="border-none py-2 px-4 rounded-lg text-[12px] font-semibold flex items-center gap-2 transition-all cursor-pointer hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <PenLine size={13} />
            <span className="hidden sm:inline">{t('roadmap.writeToday')}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
