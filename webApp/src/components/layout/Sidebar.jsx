import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard,
  Map,
  BookOpen,
  Newspaper,
  FlaskConical,
  ScrollText,
  PenTool,
  Users,
  HeartPulse,
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const navGroups = [
    {
      title: t('sidebar.study'),
      items: [
        { id: 'dashboard', label: t('sidebar.dashboard'), icon: <LayoutDashboard size={18} />, path: '/dashboard' },

        { id: 'roadmap', label: t('sidebar.myRoadmap'), icon: <Map size={18} />, path: '/roadmap' },
        { id: 'content', label: t('sidebar.studyContent'), icon: <BookOpen size={18} />, path: '/content' },
        { id: 'affairs', label: t('sidebar.currentAffairs'), icon: <Newspaper size={18} />, path: '/affairs', badge: 7 },
      ]
    },
    {
      title: t('sidebar.practice'),
      items: [
        { id: 'prelims', label: t('sidebar.prelimsLab'), icon: <FlaskConical size={18} />, path: '/prelims' },
        { id: 'pastYear', label: t('sidebar.pastYearProblems'), icon: <ScrollText size={18} />, path: '/past-year' },
        { id: 'answer', label: t('sidebar.answerWriting'), icon: <PenTool size={18} />, path: '/answers' },
      ]
    },
    {
      title: t('sidebar.growth'),
      items: [
        { id: 'community', label: t('sidebar.community'), icon: <Users size={18} />, path: '/community', badge: 3 },
        { id: 'wellbeing', label: t('sidebar.wellbeing'), icon: <HeartPulse size={18} />, path: '/wellbeing' },
      ]
    }
  ];

  return (
    <aside className={`h-screen bg-[#1C1B18] text-[#EBEAE8] flex flex-col shrink-0 border-r border-[#2f2d2a] transition-[width] duration-300 overflow-x-hidden ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
      <div className={`p-6 ${isCollapsed ? 'flex flex-col items-center gap-4 px-4' : ''}`}>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-white font-semibold">{isCollapsed ? 'D' : 'Drishti'}</h1>
          <button
            className={`bg-white/5 border border-white/10 text-[#A3A19E] w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition hover:bg-white/15 hover:text-white ${isCollapsed ? 'mx-auto' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        {!isCollapsed && <div className="text-[10px] tracking-[1px] text-[#A3A19E] uppercase mt-2">UPSC CSE PLATFORM</div>}
      </div>

      <div className={`flex items-center gap-3 border-y border-[#2f2d2a] mb-6 transition-all duration-300 ${isCollapsed ? 'p-6 justify-center' : 'p-6'}`}>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-semibold text-white text-[14px] shrink-0">AR</div>
        {!isCollapsed && (
          <div className="whitespace-nowrap">
            <p className="font-semibold text-white text-[14px]">Arjun Sharma</p>
            <span className="text-[11px] text-[#A3A19E]">2nd Attempt • GS + PSIR</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-primary [scrollbar-width:thin] [scrollbar-color:#D4613C_transparent]">
        {navGroups.map((group, idx) => (
          <div className="mb-5" key={idx}>
            {!isCollapsed && <div className="text-[10px] uppercase tracking-[1.5px] text-[#A3A19E] px-6 mb-3 whitespace-nowrap">{group.title}</div>}
            {group.items.map(item => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => `flex items-center gap-3 text-[#A3A19E] text-[14px] transition-all duration-200 justify-between whitespace-nowrap ${isCollapsed ? 'p-3 justify-center mx-2 rounded-lg hover:bg-[#292825]' : 'py-[10px] px-6 hover:bg-[#292825] hover:text-white'} ${isActive ? (isCollapsed ? 'bg-primary text-white' : 'bg-[#292825] text-white border-l-[3px] border-primary pl-[21px]') : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && <span className="bg-primary text-white text-[10px] px-[6px] py-[2px] rounded-full font-semibold">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className={`mt-auto mx-6 mb-6 bg-gradient-to-br from-[#2a2926] to-[#1f1e1b] border border-[#2f2d2a] rounded-lg flex items-center gap-3 whitespace-nowrap ${isCollapsed ? 'mx-3 p-3 justify-center' : 'py-3 px-4'}`} title={isCollapsed ? "23 day streak" : ""}>
        <Flame size={24} color="#D4613C" fill="#D4613C" />
        {!isCollapsed && (
          <div>
            <p className="text-white text-[13px] font-semibold">23 day streak</p>
            <span className="text-[11px] text-[#A3A19E]">Keep it up!</span>
          </div>
        )}
      </div>

      <div className={`mx-6 mb-6 ${isCollapsed ? 'mx-3' : ''}`}>
        <button onClick={() => dispatch(logout())} className="w-full bg-[#1C1B18] border border-[#2f2d2a] text-[#A3A19E] py-2 rounded-lg hover:text-white hover:bg-[#292825] transition cursor-pointer text-sm">
          {isCollapsed ? 'L' : t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
