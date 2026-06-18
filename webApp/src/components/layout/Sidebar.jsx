import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard,
  Map,
  BookOpen,
  Newspaper,
  FlaskConical,
  PenTool,
  Users,
  HeartPulse,
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  Trophy,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector(state => state.auth);
  const displayName = user?.name || user?.email?.split('@')[0] || 'Aspirant';
  const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const streakDays = user?.streak_days ?? 0;
  const examInfo = [user?.exam_stage, user?.optional_subject].filter(Boolean).join(' · ') || 'UPSC Aspirant';

  const navGroups = [
    {
      title: t('sidebar.study'),
      items: [
        { id: 'dashboard', label: t('sidebar.dashboard'),     icon: <LayoutDashboard size={16} />, path: '/dashboard' },
        { id: 'roadmap',   label: t('sidebar.myRoadmap'),     icon: <Map size={16} />,             path: '/roadmap' },
        { id: 'content',   label: t('sidebar.studyContent'),  icon: <BookOpen size={16} />,        path: '/content' },
        { id: 'affairs',   label: t('sidebar.currentAffairs'),icon: <Newspaper size={16} />,       path: '/affairs', badge: 7 },
        { id: 'ask-ai',    label: t('sidebar.askAI'),         icon: <Sparkles size={16} />,        path: '/ask-ai' },
      ],
    },
    {
      title: t('sidebar.practice'),
      items: [
        { id: 'prelims', label: t('sidebar.prelimsLab'),    icon: <FlaskConical size={16} />, path: '/prelims' },
        { id: 'answer',  label: t('sidebar.answerWriting'), icon: <PenTool size={16} />,      path: '/answers' },
      ],
    },
    {
      title: t('sidebar.growth'),
      items: [
        { id: 'rewards',   label: t('sidebar.rewards'),   icon: <Trophy size={16} />,    path: '/rewards' },
        { id: 'community', label: t('sidebar.community'), icon: <Users size={16} />,     path: '/community' },
        { id: 'wellbeing', label: t('sidebar.wellbeing'), icon: <HeartPulse size={16} />, path: '/wellbeing' },
      ],
    },
  ];

  const handleNavClick = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const sidebarContent = (
    <aside
      className={`h-screen text-text-primary flex flex-col shrink-0 transition-[width] duration-300 overflow-x-hidden
        ${isCollapsed ? 'w-[64px]' : 'w-[256px]'}`}
      style={{
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-sidebar)',
      }}
    >
      {/* ── Wordmark header ── */}
      <div className={`pt-5 pb-4 ${isCollapsed ? 'px-3 flex flex-col items-center gap-3' : 'px-5'}`}>
        {isCollapsed ? (
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #C4902A 0%, #E8BC5A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            D
          </span>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex flex-col leading-none">
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '26px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #C4902A 0%, #E8BC5A 60%, #C4902A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Drishti
              </span>
              <span
                className="mt-1"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  opacity: 0.7,
                }}
              >
                Civil Services
              </span>
            </div>
            <div className="flex gap-1 mt-0.5">
              <button
                className="w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)', background: 'rgba(196,144,42,0.06)', border: '1px solid rgba(196,144,42,0.12)' }}
                onClick={toggleTheme}
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              </button>
              <button
                className="w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)', background: 'rgba(196,144,42,0.06)', border: '1px solid rgba(196,144,42,0.12)' }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                title="Collapse sidebar"
              >
                <ChevronLeft size={13} />
              </button>
            </div>
          </div>
        )}

        {isCollapsed && (
          <button
            className="w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)', background: 'rgba(196,144,42,0.06)', border: '1px solid rgba(196,144,42,0.12)' }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title="Expand sidebar"
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Ornamental divider */}
      <div
        className={`mx-4 mb-3 flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}
        style={{ borderTop: '1px solid rgba(196,144,42,0.12)' }}
      />

      {/* ── User card ── */}
      <div
        className={`flex items-center gap-3 mx-3 mb-4 rounded-lg transition-all duration-300
          ${isCollapsed ? 'p-2 justify-center' : 'px-3 py-2.5'}`}
        style={{
          background: 'rgba(196,144,42,0.06)',
          border: '1px solid rgba(196,144,42,0.14)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[11px] shrink-0"
          style={{
            background: 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)',
          }}
        >
          {initials}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="font-semibold text-[13px] truncate" style={{ color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{displayName}</p>
            <span className="text-[11px] capitalize truncate block" style={{ color: 'var(--text-muted)' }}>{examInfo}</span>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto pb-2">
        {navGroups.map((group, idx) => (
          <div className="mb-5" key={idx}>
            {!isCollapsed && (
              <div
                className="px-5 mb-1.5"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '9.5px',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  opacity: 0.6,
                }}
              >
                {group.title}
              </div>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.id}
                to={item.path}
                title={item.label}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `relative flex items-center text-[13px] transition-all duration-150 whitespace-nowrap
                  ${isCollapsed
                    ? 'justify-center mx-2 my-0.5 p-2.5 rounded-lg'
                    : 'justify-between py-[8px] px-5'
                  }
                  ${isActive ? '' : 'hover:text-text-primary'}`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#C4902A' : 'var(--text-secondary)',
                  background: isActive
                    ? isCollapsed
                      ? 'rgba(196,144,42,0.1)'
                      : 'linear-gradient(90deg, rgba(196,144,42,0.08) 0%, transparent 100%)'
                    : 'transparent',
                  borderLeft: !isCollapsed && isActive ? '2px solid #C4902A' : !isCollapsed ? '2px solid transparent' : 'none',
                  paddingLeft: !isCollapsed && isActive ? '18px' : !isCollapsed ? '20px' : undefined,
                  borderRadius: isCollapsed ? '8px' : '0',
                })}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  {!isCollapsed && <span style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none"
                    style={{
                      background: 'rgba(196,144,42,0.15)',
                      border: '1px solid rgba(196,144,42,0.3)',
                      color: '#C4902A',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Streak chip ── */}
      {streakDays > 0 && (
        <div
          className={`mx-3 mb-3 rounded-lg flex items-center gap-2.5
            ${isCollapsed ? 'p-2 justify-center' : 'px-3 py-2.5'}`}
          style={{
            background: 'rgba(196,144,42,0.08)',
            border: '1px solid rgba(196,144,42,0.2)',
          }}
          title={isCollapsed ? `${streakDays} day streak` : undefined}
        >
          <Flame
            size={16}
            style={{
              color: '#C4902A',
              fill: '#C4902A',
              flexShrink: 0,
              filter: streakDays >= 7 ? 'drop-shadow(0 0 5px rgba(196,144,42,0.7))' : 'none',
            }}
          />
          {!isCollapsed && (
            <div>
              <p
                className="text-[12px] font-bold leading-tight"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  background: 'linear-gradient(135deg, #E8BC5A 0%, #C4902A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {streakDays} day streak
              </p>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Keep it up!</span>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-3 pb-4 flex flex-col gap-1.5">
        {['admin', 'moderator'].includes(user?.role) && (
          <NavLink
            to="/admin"
            title="Admin"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `w-full border py-2 rounded-lg transition-colors cursor-pointer text-[12px] flex items-center justify-center gap-2
              ${isActive ? 'bg-primary text-white border-primary' : 'bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500/10'}`
            }
          >
            <ShieldCheck size={14} />
            {!isCollapsed && t('common.admin')}
          </NavLink>
        )}
        {!isCollapsed && (
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `w-full py-2 rounded-lg transition-colors cursor-pointer text-[12px] flex items-center justify-center gap-2
              ${isActive ? 'text-primary' : ''}`
            }
            style={({ isActive }) => ({
              color: isActive ? '#C4902A' : 'var(--text-secondary)',
              background: 'rgba(196,144,42,0.05)',
              border: '1px solid rgba(196,144,42,0.12)',
              fontFamily: "'DM Sans', sans-serif",
            })}
          >
            <Settings size={14} />
            {t('sidebar.settings')}
          </NavLink>
        )}
        <button
          onClick={() => dispatch(logout())}
          title={t('sidebar.logout')}
          className="w-full py-2 rounded-lg transition-colors cursor-pointer text-[12px] flex items-center justify-center gap-2"
          style={{
            color: 'var(--text-muted)',
            background: 'rgba(196,144,42,0.03)',
            border: '1px solid rgba(196,144,42,0.08)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <LogOut size={14} />
          {!isCollapsed && t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">{sidebarContent}</div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[200] lg:hidden"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsMobileOpen?.(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[201] flex lg:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
