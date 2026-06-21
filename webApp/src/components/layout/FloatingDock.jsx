import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Map, Newspaper, Target, PenTool, Users, 
  GraduationCap, Settings, Trophy, BookOpen, Compass, 
  Sparkles, BrainCircuit, Activity
} from 'lucide-react';

// Grouped Navigation
const DOCK_GROUPS = [
  {
    id: 'learn',
    label: 'Learn & Discover',
    icon: Compass,
    color: 'from-orange-400 to-rose-400',
    subItems: [
      { path: '/dashboard', label: 'Dashboard', icon: ShieldAlert },
      { path: '/roadmap', label: 'Roadmap', icon: Map },
      { path: '/content', label: 'Study Content', icon: BookOpen },
      { path: '/affairs', label: 'Current Affairs', icon: Newspaper },
    ]
  },
  {
    id: 'practice',
    label: 'Practice & Combat',
    icon: Target,
    color: 'from-blue-400 to-indigo-400',
    subItems: [
      { path: '/prelims', label: 'Prelims Simulator', icon: Target },
      { path: '/answers', label: 'Mains Writing', icon: PenTool },
    ]
  },
  {
    id: 'community',
    label: 'Alliance & Wellness',
    icon: Users,
    color: 'from-emerald-400 to-teal-400',
    subItems: [
      { path: '/community', label: 'Aspirant Network', icon: Users },
      { path: '/wellbeing', label: 'Silent Library & Focus', icon: Activity },
    ]
  },
  {
    id: 'ai',
    label: 'AI & Rewards',
    icon: Sparkles,
    color: 'from-purple-400 to-pink-400',
    subItems: [
      { path: '/ask-ai', label: 'Ask AI Mentor', icon: BrainCircuit },
      { path: '/rewards', label: 'Ranks & Honors', icon: Trophy },
    ]
  }
];

const FloatingDock = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = (groupId) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredGroup(groupId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredGroup(null);
    }, 150); // slight delay to make moving to submenu easier
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]">
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        
        {DOCK_GROUPS.map((group) => {
          // Check if any subItem is currently active
          const isActiveGroup = group.subItems.some(sub => 
            location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`)
          );
          const isHovered = hoveredGroup === group.id;

          return (
            <div 
              key={group.id}
              className="relative group flex flex-col items-center"
              onMouseEnter={() => handleMouseEnter(group.id)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Expanded Sub-Menu Popup */}
              <div 
                className={`absolute bottom-[120%] mb-2 min-w-[200px] flex flex-col gap-1 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 origin-bottom z-50
                  ${isHovered ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`
                }
              >
                {/* Header for group */}
                <div className="px-3 py-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  {group.label}
                </div>

                {group.subItems.map(sub => {
                  const isSubActive = location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`);
                  return (
                    <button
                      key={sub.path}
                      onClick={() => {
                        navigate(sub.path);
                        setHoveredGroup(null);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left
                        ${isSubActive 
                          ? 'bg-primary/10 text-primary dark:text-orange-400' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }
                      `}
                    >
                      <sub.icon size={16} className={isSubActive ? 'text-primary dark:text-orange-400' : 'text-slate-400'} />
                      {sub.label}
                    </button>
                  );
                })}
                
                {/* Pointer Arrow */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 rotate-45"></div>
              </div>

              {/* Main Dock Button */}
              <button
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 overflow-hidden cursor-default
                  ${isActiveGroup 
                    ? `bg-gradient-to-br ${group.color} shadow-md text-white -translate-y-1` 
                    : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:-translate-y-1 hover:shadow-sm'
                  }
                `}
              >
                <group.icon size={20} className="transition-transform duration-300" />
              </button>
              
              {/* Optional tiny dot indicator if active */}
              {isActiveGroup && !isHovered && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              )}
            </div>
          );
        })}

        {/* Divider */}
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

        {/* Settings - standalone item */}
        <div 
          className="relative group flex flex-col items-center"
          onMouseEnter={() => handleMouseEnter('settings')}
          onMouseLeave={handleMouseLeave}
        >
          {/* Tooltip for settings */}
          <div className={`absolute bottom-[120%] mb-2 px-3 py-1.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-lg transition-all duration-300 whitespace-nowrap origin-bottom z-50
            ${hoveredGroup === 'settings' ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
          >
            System Settings
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-white rotate-45"></div>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden
              ${location.pathname === '/settings'
                ? 'bg-slate-800 dark:bg-slate-100 shadow-md text-white dark:text-slate-900 -translate-y-1' 
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:-translate-y-1 hover:shadow-sm'
              }
            `}
          >
            <Settings size={20} className={`transition-transform duration-500 ${hoveredGroup === 'settings' ? 'rotate-90' : ''}`} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default FloatingDock;
