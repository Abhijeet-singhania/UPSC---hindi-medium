import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Topbar from './Topbar';
import FloatingDock from './FloatingDock';
import BrandMascot from '../common/BrandMascot';
import { useUI } from '../../context/UIContext';
import { useAvatar } from '../../context/AvatarContext';
import { Flame, Clock, Users, CheckCircle2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const AppLayout = () => {
  const location = useLocation();
  const scrollRef = useRef(null);
  const { testMode } = useUI();
  const { setAvatarState } = useAvatar();
  const { user, token } = useSelector(state => state.auth);

  const [activeLibUsers, setActiveLibUsers] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
    // Trigger action state on navigation (unless in test mode)
    if (!testMode) {
      setAvatarState('action', 1500); // Pulse brightly for 1.5s then return to idle
    }
  }, [location.pathname]);

  // Fetch live library count + today's study time for the status strip
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/silent-library/active`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setActiveLibUsers(d.count ?? 0))
      .catch(() => {});

    if (token) {
      fetch(`${API_BASE}/api/v1/silent-library/history/me?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(sessions => {
          const todayStr = new Date().toISOString().substring(0, 10);
          let mins = 0;
          for (const s of sessions) {
            if (s.start_time?.substring(0, 10) === todayStr && s.duration_minutes) {
              mins += s.duration_minutes;
            }
          }
          setTodayMinutes(mins);
        })
        .catch(() => {});
    }
  }, [token, location.pathname]);

  const streak = user?.streak_days ?? 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div ref={scrollRef} className="flex-1 flex flex-col overflow-y-auto h-full min-w-0 w-full relative">
        {!testMode && <Topbar />}

        {/* ── Command Center Status Strip ── */}
        {!testMode && (
          <div className="cc-status-strip hidden lg:flex">
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-text-muted" />
              <span className="cc-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {todayMinutes}m
              </span>
              <span className="text-[10px]">studied today</span>
            </div>

            <div style={{ width: 1, height: 12, background: 'var(--cc-panel-border)' }} />

            {streak > 0 && (
              <div className="flex items-center gap-1.5">
                <Flame size={11} style={{ color: '#C4902A', fill: '#C4902A' }} />
                <span className="cc-mono font-semibold" style={{ color: '#C4902A' }}>
                  {streak}d streak
                </span>
              </div>
            )}

            <div style={{ width: 1, height: 12, background: 'var(--cc-panel-border)' }} />

            <div className="flex items-center gap-1.5">
              <span className="cc-pulse" style={{ width: 5, height: 5, background: '#2D8A5E' }} />
              <Users size={11} className="text-text-muted" />
              <span className="cc-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {activeLibUsers}
              </span>
              <span className="text-[10px]">in library</span>
            </div>

            <div className="ml-auto flex items-center gap-1.5 text-[10px]">
              <CheckCircle2 size={10} className="text-text-muted" />
              <span>System operational</span>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden w-full pb-32">
          {/* Constrain main content width to roughly 1400px max, centered, to avoid feeling lost on ultra-wide */}
          <div className="mx-auto w-full max-w-[1400px] p-6 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>

      {!testMode && <FloatingDock />}
      {!testMode && <BrandMascot />}
    </div>
  );
};

export default AppLayout;
