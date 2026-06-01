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
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector(state => state.auth);
  const displayName = user?.name || user?.email?.split('@')[0] || 'Aspirant';
  const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const streakDays = user?.streak_days ?? 0;
  const examInfo = [user?.exam_stage, user?.optional_subject].filter(Boolean).join(' • ') || 'UPSC Aspirant';

  const navGroups = [
    {
      title: t('sidebar.study'),
      items: [
        { id: 'dashboard', label: t('sidebar.dashboard'), icon: <LayoutDashboard size={18} />, path: '/dashboard' },
        { id: 'roadmap', label: t('sidebar.myRoadmap'), icon: <Map size={18} />, path: '/roadmap' },
        { id: 'content', label: t('sidebar.studyContent'), icon: <BookOpen size={18} />, path: '/content' },
        { id: 'affairs', label: t('sidebar.currentAffairs'), icon: <Newspaper size={18} />, path: '/affairs', badge: 7 },
        { id: 'ask-ai', label: t('sidebar.askAI'), icon: <Sparkles size={18} />, path: '/ask-ai' },
      ]
    },
    {
      title: t('sidebar.practice'),
      items: [
        { id: 'prelims', label: t('sidebar.prelimsLab'), icon: <FlaskConical size={18} />, path: '/prelims' },
        { id: 'answer', label: t('sidebar.answerWriting'), icon: <PenTool size={18} />, path: '/answers' },
      ]
    },
    {
      title: t('sidebar.growth'),
      items: [
        { id: 'rewards', label: t('sidebar.rewards'), icon: <Trophy size={18} />, path: '/rewards' },
        { id: 'community', label: t('sidebar.community'), icon: <Users size={18} />, path: '/community' },
        { id: 'wellbeing', label: t('sidebar.wellbeing'), icon: <HeartPulse size={18} />, path: '/wellbeing' },
      ]
    }
  ];

  return (
    <aside className={`h-screen bg-bg-panel text-text-primary flex flex-col shrink-0 border-r border-border-default transition-[width] duration-300 overflow-x-hidden ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
      <div className={`p-6 ${isCollapsed ? 'flex flex-col items-center gap-4 px-4' : ''}`}>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-text-primary font-semibold">{isCollapsed ? 'D' : 'Drishti'}</h1>
          <div className="flex gap-2">
            {!isCollapsed && (
              <button
                className={`bg-white/5 border border-white/10 text-text-secondary w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition hover:bg-white/15 hover:text-text-primary`}
                onClick={toggleTheme}
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            <button
              className={`bg-white/5 border border-white/10 text-text-secondary w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition hover:bg-white/15 hover:text-text-primary ${isCollapsed ? 'mx-auto' : ''}`}
              onClick={() => setIsCollapsed(!isCollapsed)}
              title="Toggle Sidebar"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
        {!isCollapsed && <div className="text-[10px] tracking-[1px] text-text-secondary uppercase mt-2">UPSC CSE PLATFORM</div>}
      </div>

      <div className={`flex items-center gap-3 border-y border-border-default mb-6 transition-all duration-300 ${isCollapsed ? 'p-6 justify-center' : 'p-6'}`}>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-semibold text-white text-[14px] shrink-0">{initials}</div>
        {!isCollapsed && (
          <div className="whitespace-nowrap overflow-hidden">
            <p className="font-semibold text-text-primary text-[14px] truncate max-w-[150px]">{displayName}</p>
            <span className="text-[11px] text-text-secondary capitalize">{examInfo}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div className="mb-5" key={idx}>
            {!isCollapsed && <div className="text-[10px] uppercase tracking-[1.5px] text-text-secondary px-6 mb-3 whitespace-nowrap">{group.title}</div>}
            {group.items.map(item => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => `flex items-center gap-3 text-text-secondary text-[14px] transition-all duration-200 justify-between whitespace-nowrap ${isCollapsed ? 'p-3 justify-center mx-2 rounded-lg hover:bg-bg-panel-hover' : 'py-[10px] px-6 hover:bg-bg-panel-hover hover:text-text-primary'} ${isActive ? (isCollapsed ? 'bg-primary text-text-primary' : 'bg-bg-panel-hover text-text-primary border-l-[3px] border-primary pl-[21px]') : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && <span className="bg-primary text-text-primary text-[10px] px-[6px] py-[2px] rounded-full font-semibold">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {streakDays > 0 && (
        <div className={`mt-auto mx-6 mb-6 bg-gradient-to-br from-bg-surface-dark to-bg-surface border border-border-default rounded-lg flex items-center gap-3 whitespace-nowrap ${isCollapsed ? 'mx-3 p-3 justify-center' : 'py-3 px-4'}`} title={isCollapsed ? `${streakDays} day streak` : ''}>
          <Flame size={24} color="#D4613C" fill="#D4613C" />
          {!isCollapsed && (
            <div>
              <p className="text-text-primary text-[13px] font-semibold">{streakDays} day streak</p>
              <span className="text-[11px] text-text-secondary">Keep it up!</span>
            </div>
          )}
        </div>
      )}

      <div className={`mx-6 mb-6 flex flex-col gap-2 ${isCollapsed ? 'mx-3' : ''}`}>
        {['admin', 'moderator'].includes(user?.role) && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `w-full border py-2 rounded-lg transition cursor-pointer text-sm flex items-center justify-center gap-2 ${isActive ? 'bg-primary text-white border-primary' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}`}
            title={isCollapsed ? 'Admin' : ''}
          >
            <ShieldCheck size={16} />
            {!isCollapsed && t('common.admin')}
          </NavLink>
        )}
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `w-full border border-border-default py-2 rounded-lg transition cursor-pointer text-sm flex items-center justify-center gap-2 ${isActive ? 'bg-primary text-text-primary border-primary' : 'bg-bg-panel text-text-secondary hover:text-text-primary hover:bg-bg-panel-hover'}`}
          title={isCollapsed ? t('sidebar.settings') : ''}
        >
          <Settings size={16} />
          {!isCollapsed && t('sidebar.settings')}
        </NavLink>
        <button onClick={() => dispatch(logout())} className="w-full bg-bg-panel border border-border-default text-text-secondary py-2 rounded-lg hover:text-text-primary hover:bg-bg-panel-hover transition cursor-pointer text-sm">
          {isCollapsed ? 'L' : t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
