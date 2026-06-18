import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Play, Pause, BookOpen, Users, Clock, Zap,
  CheckCircle2, Coffee, FlameIcon, Activity, Loader2,
  Volume2, VolumeX, Music, SkipBack, SkipForward, ListMusic, Plus, Trash2,
} from 'lucide-react';
import { PageHeader } from '../../components/ui';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// ─── Focus Room — setup card → fullscreen Pomodoro + Silent Library ───────────

const SHORT_BREAK = 5;
const LONG_BREAK = 15;

const FocusRoom = () => {
  const { t } = useTranslation();
  const { user, token } = useSelector(state => state.auth);

  // ── Session (library tracking) ──────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [activeUserList, setActiveUserList] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [lastEarned, setLastEarned] = useState(null);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // ── Interval (pomodoro countdown) ───────────────────────────────────────────
  const [selectedFocusMins, setSelectedFocusMins] = useState(25);
  const [intervalSecs, setIntervalSecs] = useState(25 * 60);
  const [intervalBase, setIntervalBase] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [intervalDone, setIntervalDone] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const isActiveRef = useRef(false);
  const tokenRef = useRef(token);
  const sessionTimerRef = useRef(null);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const authHdr = () => ({ Authorization: `Bearer ${tokenRef.current}` });

  const applyActiveData = useCallback((d) => {
    if (!d) return;
    setActiveUsers(d.count ?? 0);
    setActiveUserList(Array.isArray(d.users) ? d.users : []);
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/active`);
      if (r.ok) applyActiveData(await r.json());
    } catch (_) {}
  }, [applyActiveData]);

  const fetchHistory = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/history/me?limit=5`, { headers: authHdr() });
      if (r.ok) { const all = await r.json(); setSessionHistory(all.filter(s => s.end_time)); }
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mount: resume open session + load history
  useEffect(() => {
    fetchActive();
    fetchHistory();
    if (token) {
      fetch(`${API_BASE}/api/v1/silent-library/history/me?limit=1`, { headers: authHdr() })
        .then(r => r.ok ? r.json() : [])
        .then(sessions => {
          if (sessions.length > 0 && !sessions[0].end_time) {
            const elapsed = Math.max(0, Math.floor((Date.now() - new Date(sessions[0].start_time).getTime()) / 1000));
            setIsActive(true);
            setSessionElapsed(elapsed);
          }
        }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live presence via Server-Sent Events (Redis pub/sub on the backend)
  useEffect(() => {
    let es = null;
    let fallbackPoll = null;

    const startFallbackPoll = () => {
      if (fallbackPoll) return;
      fetchActive();
      fallbackPoll = setInterval(fetchActive, 15000);
    };

    try {
      es = new EventSource(`${API_BASE}/api/v1/silent-library/active/stream`);
      es.onmessage = (event) => {
        try { applyActiveData(JSON.parse(event.data)); } catch (_) {}
      };
      es.onerror = () => {
        es?.close();
        es = null;
        startFallbackPoll();
      };
    } catch (_) {
      startFallbackPoll();
    }

    return () => {
      es?.close();
      if (fallbackPoll) clearInterval(fallbackPoll);
    };
  }, [applyActiveData, fetchActive]);

  // Session elapsed ticker
  useEffect(() => {
    if (isActive) { sessionTimerRef.current = setInterval(() => setSessionElapsed(s => s + 1), 1000); }
    else { clearInterval(sessionTimerRef.current); }
    return () => clearInterval(sessionTimerRef.current);
  }, [isActive]);

  // Interval countdown
  useEffect(() => {
    if (!isTimerRunning) return;
    if (intervalSecs <= 0) {
      setIsTimerRunning(false); setIntervalDone(true);
      if (!isBreak) setCompletedRounds(r => r + 1);
      return;
    }
    const tick = setTimeout(() => setIntervalSecs(s => s - 1), 1000);
    return () => clearTimeout(tick);
  }, [isTimerRunning, intervalSecs, isBreak]);

  const doEndSessionRef = useRef(null);

  // End session when user leaves focus screen (tab/app switch or fullscreen exit)
  useEffect(() => {
    if (!isActive) return;
    let fullscreenReady = false;
    const readyTimer = setTimeout(() => { fullscreenReady = true; }, 800);

    const endForViolation = (reason) => {
      setError(reason);
      doEndSessionRef.current?.();
    };

    const onVisibility = () => {
      if (document.hidden) endForViolation('Session ended: you left the focus screen.');
    };

    const onFullscreen = () => {
      if (!document.fullscreenElement && fullscreenReady) {
        endForViolation('Session ended: full screen was exited.');
      }
    };

    const onBlur = () => {
      if (!document.hidden && fullscreenReady) {
        endForViolation('Session ended: switched to another application.');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('blur', onBlur);

    return () => {
      clearTimeout(readyTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('blur', onBlur);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Auto-leave on close / unmount
  useEffect(() => {
    const leaveOnUnload = () => {
      if (!isActiveRef.current || !tokenRef.current) return;
      fetch(`${API_BASE}/api/v1/silent-library/leave`, { method: 'POST', headers: authHdr(), keepalive: true });
    };
    window.addEventListener('beforeunload', leaveOnUnload);
    return () => { window.removeEventListener('beforeunload', leaveOnUnload); leaveOnUnload(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const doStartSession = async () => {
    if (!token) { setError('Please log in first.'); return; }
    setError(''); setIsBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/join`, { method: 'POST', headers: authHdr() });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || 'Failed to start'); }
      const data = await r.json();
      const alreadyElapsed = Math.max(0, Math.floor((Date.now() - new Date(data.start_time).getTime()) / 1000));
      setIsActive(true); setSessionElapsed(alreadyElapsed); setLastEarned(null);
      setIntervalBase(selectedFocusMins * 60); setIntervalSecs(selectedFocusMins * 60);
      setIsBreak(false); setIntervalDone(false); setIsTimerRunning(true); setCompletedRounds(0);
      fetchActive();
      // Go fullscreen
      try { await document.documentElement.requestFullscreen(); } catch (_) {}
    } catch (e) { setError(e.message); } finally { setIsBusy(false); }
  };

  const doEndSession = async () => {
    setIsTimerRunning(false); setIsBusy(true);
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch (_) {} }
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/leave`, { method: 'POST', headers: authHdr() });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || 'Failed to end'); }
      const data = await r.json();
      setIsActive(false); setSessionElapsed(0); setIntervalDone(false); setCompletedRounds(0);
      setIntervalBase(selectedFocusMins * 60); setIntervalSecs(selectedFocusMins * 60); setIsBreak(false);
      setLastEarned({ minutes: data.duration_minutes, points: data.duration_minutes * 2 });
      fetchActive(); fetchHistory();
    } catch (e) { setError(e.message); } finally { setIsBusy(false); }
  };

  useEffect(() => { doEndSessionRef.current = doEndSession; }, [doEndSession]);

  const startNextInterval = (breakMode, mins) => {
    setIsBreak(breakMode);
    setIntervalBase(mins * 60); setIntervalSecs(mins * 60);
    setIntervalDone(false); setIsTimerRunning(true);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const displayUserList = useMemo(() => {
    const list = activeUserList.map(u => ({
      ...u,
      isMe: user?.id != null && u.id === user.id,
    }));
    if (isActive && user?.id && !list.some(u => u.id === user.id)) {
      list.unshift({
        id: user.id,
        name: user.name || user.email?.split('@')[0] || 'You',
        study_since: new Date().toISOString(),
        isMe: true,
      });
    }
    return list;
  }, [activeUserList, isActive, user]);

  const roomCount = isActive ? Math.max(activeUsers, displayUserList.length) : activeUsers;
  const xpEarned = Math.floor(sessionElapsed / 60) * 2;
  const ringPct = intervalBase > 0 ? (intervalSecs / intervalBase) * 100 : 100;
  const ringColor = isBreak ? '#2B7A4B' : 'var(--color-primary)';
  const C = 2 * Math.PI * 60; // r=60 circumference
  const suggestLongBreak = completedRounds > 0 && completedRounds % 4 === 0;

  // ── IDLE: setup card ────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="bg-bg-surface-dark text-text-primary rounded-2xl p-8 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={15} className="text-primary" />
              <span className="text-[10px] tracking-[3px] uppercase font-bold text-primary">Focus Room</span>
            </div>
            <h3 className="font-serif text-[22px] font-semibold">Silent Study Session</h3>
            <p className="text-text-muted text-[12px] mt-1">Study with others · earn 2 XP / min · Pomodoro intervals</p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 shrink-0">
            <Users size={13} className="text-text-muted" />
            <span className="text-[13px] font-semibold">{activeUsers}</span>
            <span className="text-text-muted text-[11px]">studying now</span>
          </div>
        </div>

        {/* Last session XP badge */}
        {lastEarned && (
          <div className="mb-6 bg-[#EBF5F0]/15 border border-[#2B7A4B]/40 rounded-xl px-5 py-3 flex items-center justify-between">
            <span className="text-[#6BCB97] text-[13px] font-semibold">Last session complete!</span>
            <span className="text-primary font-bold">+{lastEarned.points} XP · {lastEarned.minutes} min</span>
          </div>
        )}

        {/* Preset row + CTA */}
        <div className="flex items-end gap-6 mb-6">
          <div className="flex-1 flex flex-col gap-4">
            {/* Focus duration */}
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-widest mb-2">Focus duration</div>
              <div className="flex gap-2">
                {[25, 45, 60].map(m => (
                  <button key={m} onClick={() => { setSelectedFocusMins(m); setIntervalBase(m * 60); setIntervalSecs(m * 60); }}
                    className={`px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition border ${
                      selectedFocusMins === m
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-white/5 border-white/15 text-text-secondary hover:bg-white/10 hover:text-text-primary'
                    }`}>
                    {m} min
                  </button>
                ))}
              </div>
            </div>
            {/* Break info */}
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-widest mb-2">Breaks (auto-suggested)</div>
              <div className="flex gap-2">
                <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-text-muted flex items-center gap-1.5">
                  <Coffee size={11} className="text-[#2B7A4B]" /> Short break · 5 min
                </span>
                <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-text-muted flex items-center gap-1.5">
                  <Coffee size={11} className="text-primary" /> Long break · 15 min (every 4 rounds)
                </span>
              </div>
            </div>
          </div>

          {/* Start CTA */}
          <button onClick={doStartSession} disabled={isBusy}
            className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-semibold text-[15px] flex items-center gap-2.5 transition cursor-pointer disabled:opacity-60 shadow-lg shadow-primary/20 shrink-0">
            {isBusy ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="white" />}
            {isBusy ? 'Starting…' : 'Start Focus Session'}
          </button>
        </div>

        {error && <div className="mb-4 text-red-400 text-[12px] bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>}

        {/* Recent sessions */}
        <div className="pt-5 border-t border-white/10">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Recent sessions</div>
          {sessionHistory.length === 0 ? (
            <p className="text-[12px] text-text-muted italic">No completed sessions yet — start one above!</p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {sessionHistory.map((s, i) => {
                const mins = s.duration_minutes || 0;
                const label = mins === 0 ? '< 1m' : `${mins}m`;
                const xp = mins * 2;
                return (
                  <div key={i} className="flex-1 min-w-[80px] bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-center">
                    <div className="text-[11px] text-text-muted">{new Date(s.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    <div className="text-[20px] font-serif font-semibold mt-0.5">{label}</div>
                    <div className="text-[11px] text-primary">+{xp} XP</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ACTIVE: fullscreen overlay ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0d0d0d] text-white flex flex-col">
      <style>{`
        @keyframes fr-pulse { 0%,100%{filter:drop-shadow(0 0 6px ${ringColor})} 50%{filter:drop-shadow(0 0 24px ${ringColor})} }
        .fr-ring-running { animation: fr-pulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-10 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen size={15} className="text-primary" />
          <span className="text-[10px] tracking-[3px] uppercase font-bold text-primary">Focus Room</span>
          <span className="w-px h-4 bg-white/20 mx-1" />
          <span className="text-[12px] text-white/50">
            {fmt(sessionElapsed)} total &middot; {completedRounds} rounds &middot; +{xpEarned} XP
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[12px] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <Users size={13} />
            <span className="font-semibold text-white">{roomCount}</span> in the room
          </div>
          <button onClick={doEndSession} disabled={isBusy}
            className="bg-white/8 hover:bg-red-500/20 border border-white/15 hover:border-red-500/40 text-white/70 hover:text-red-400 px-5 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2 transition cursor-pointer disabled:opacity-60">
            {isBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            {isBusy ? 'Ending…' : 'End Session'}
          </button>
        </div>
      </div>

      {/* Body: center timer + right panel */}
      <div className="flex-1 flex min-h-0">

        {/* ── Center: timer ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-10">

          {/* Mode label */}
          <div className="text-[11px] tracking-[4px] uppercase font-bold" style={{ color: ringColor }}>
            {isBreak ? (intervalBase >= LONG_BREAK * 60 ? 'LONG BREAK' : 'SHORT BREAK') : 'FOCUS'}
          </div>

          {/* Ring */}
          <div className="relative w-72 h-72">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
              <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
              <circle
                cx="72" cy="72" r="60" fill="none"
                stroke={ringColor} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - ringPct / 100)}
                className={`transition-all duration-1000 ${isTimerRunning ? 'fr-ring-running' : ''}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="text-[60px] font-mono font-bold leading-none tabular-nums">{fmt(intervalSecs)}</div>
              <div className="text-[12px] text-white/30">of {fmt(intervalBase)}</div>
            </div>
          </div>

          {/* Controls */}
          {!intervalDone ? (
            <div className="flex flex-col items-center gap-4">
              {/* Primary: pause / resume */}
              <button onClick={() => setIsTimerRunning(r => !r)}
                className="bg-white/10 hover:bg-white/18 border border-white/15 px-10 py-3.5 rounded-xl text-[14px] font-medium flex items-center gap-2.5 cursor-pointer transition">
                {isTimerRunning ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
                {isTimerRunning ? 'Pause' : 'Resume'}
              </button>

              {/* Secondary: take break (during focus) or end break early */}
              {!isBreak ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/30 mr-1">Take a break:</span>
                  <button onClick={() => startNextInterval(true, SHORT_BREAK)}
                    className="bg-[#2B7A4B]/60 hover:bg-[#2B7A4B] border border-[#2B7A4B]/50 text-[#6BCB97] px-4 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition">
                    Short · 5 min
                  </button>
                  <button onClick={() => startNextInterval(true, LONG_BREAK)}
                    className="bg-[#2B7A4B]/30 hover:bg-[#2B7A4B]/60 border border-[#2B7A4B]/30 text-[#6BCB97]/70 px-4 py-1.5 rounded-lg text-[12px] cursor-pointer transition">
                    Long · 15 min
                  </button>
                </div>
              ) : (
                <button onClick={() => startNextInterval(false, selectedFocusMins)}
                  className="bg-primary/20 hover:bg-primary/40 border border-primary/40 text-primary px-6 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition">
                  End break early → Start focus
                </button>
              )}
            </div>
          ) : (
            /* Interval done — full prompt */
            <div className="flex flex-col items-center gap-4">
              <p className="text-[14px] text-white/60">
                {isBreak
                  ? "Break's over — ready for the next round?"
                  : `Round ${completedRounds} done! How long a break?`}
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                {!isBreak && (
                  <>
                    <button onClick={() => startNextInterval(true, SHORT_BREAK)}
                      className="bg-[#2B7A4B] hover:bg-[#3a9e64] text-white px-6 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition">
                      Short Break · 5 min
                    </button>
                    <button onClick={() => startNextInterval(true, LONG_BREAK)}
                      className={`px-6 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition border ${
                        suggestLongBreak
                          ? 'bg-[#1e5c38] hover:bg-[#2B7A4B] text-[#6BCB97] border-[#2B7A4B]'
                          : 'bg-white/5 hover:bg-white/10 border-white/15 text-white/50'
                      }`}>
                      Long Break · 15 min {suggestLongBreak && '✦'}
                    </button>
                    <button onClick={() => startNextInterval(false, selectedFocusMins)}
                      className="bg-white/8 hover:bg-white/15 border border-white/15 text-white/70 px-6 py-2.5 rounded-lg text-[13px] cursor-pointer transition">
                      Skip break
                    </button>
                  </>
                )}
                {isBreak && (
                  <button onClick={() => startNextInterval(false, selectedFocusMins)}
                    className="bg-primary hover:bg-primary-hover text-white px-10 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition shadow-lg shadow-primary/20">
                    Start Focus
                  </button>
                )}
              </div>
            </div>
          )}

          {error && <div className="text-red-400 text-[12px] bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>}
        </div>

        {/* ── Right sidebar: people + music ── */}
        <div className="w-80 border-l border-white/10 flex flex-col shrink-0">
          {/* Who's studying */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={11} /> Studying right now
            </div>
            {displayUserList.length === 0 ? (
              <p className="text-[12px] text-white/25 italic">No one else yet — you set the tone!</p>
            ) : (
              <div className="flex flex-col gap-3">
                {displayUserList.slice(0, 10).map((u) => (
                  <div key={u.id ?? u.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[12px] font-bold text-primary shrink-0">
                      {(u.name || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-[13px] text-white/70 flex items-center gap-2">
                      {u.name}
                      {u.isMe && (
                        <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Music player */}
          <div className="border-t border-white/10 px-6 py-5 bg-white/[0.02] shrink-0">
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Music size={11} /> Ambient music
            </div>
            <MusicPlayer compact />
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Study Stats ──────────────────────────────────────────────────────────────

const StudyStatsCard = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
      <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-4">Your Study Stats</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg-panel-hover p-4 rounded-xl">
          <div className="text-[22px] font-serif font-semibold text-text-primary">{stats.total_hours}h</div>
          <div className="text-[11px] text-text-muted mt-0.5">Total focus time</div>
        </div>
        <div className="bg-bg-panel-hover p-4 rounded-xl">
          <div className="text-[22px] font-serif font-semibold text-text-primary">{stats.weekly_hours}h</div>
          <div className="text-[11px] text-text-muted mt-0.5">This week</div>
        </div>
        <div className="bg-bg-panel-hover p-4 rounded-xl">
          <div className="text-[22px] font-serif font-semibold text-text-primary">{stats.streak_days}</div>
          <div className="text-[11px] text-text-muted mt-0.5">Day streak</div>
        </div>
        <div className="bg-bg-panel-hover p-4 rounded-xl">
          <div className="text-[22px] font-serif font-semibold text-text-primary">{stats.total_sessions}</div>
          <div className="text-[11px] text-text-muted mt-0.5">Total sessions</div>
        </div>
      </div>
      {stats.streak_days >= 3 && (
        <div className="mt-4 flex items-center gap-2 text-primary text-[12px] font-medium">
          <FlameIcon size={14} /> {stats.streak_days}-day streak! Keep it going.
        </div>
      )}
    </div>
  );
};

// ─── Music Player ─────────────────────────────────────────────────────────────

const MUSIC_TRACKS = [
  { id: 'lofi', name: 'Lo-Fi Chill', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { id: 'rain', name: 'Rain & Thunder', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bde80a.mp3' },
  { id: 'nature', name: 'Forest Birds', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_82e3f5d54f.mp3' },
];

const MusicPlayer = ({ compact = false }) => {
  const [tracks, setTracks] = useState(MUSIC_TRACKS);
  const [customUrl, setCustomUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const nextIdx = (currentTrack + 1) % tracks.length;
    setCurrentTrack(nextIdx);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }, 50);
  };

  const handlePrev = () => {
    const prevIdx = (currentTrack - 1 + tracks.length) % tracks.length;
    setCurrentTrack(prevIdx);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }, 50);
  };

  const addCustomTrack = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const newTrack = { id: 'custom-' + Date.now(), name: 'Custom URL', url: customUrl.trim() };
    const newTracks = [...tracks, newTrack];
    setTracks(newTracks);
    setCurrentTrack(newTracks.length - 1);
    setCustomUrl('');
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }, 50);
  };

  const handleDeleteTrack = (idx, e) => {
    e.stopPropagation();
    const newTracks = tracks.filter((_, i) => i !== idx);
    setTracks(newTracks);
    if (idx === currentTrack) {
      const nextIdx = Math.max(0, idx - 1);
      setCurrentTrack(nextIdx);
      if (isPlaying && newTracks.length > 0) {
        setTimeout(() => {
          audioRef.current?.play().catch(() => setIsPlaying(false));
        }, 50);
      } else if (newTracks.length === 0) {
        setIsPlaying(false);
      }
    } else if (idx < currentTrack) {
      setCurrentTrack(currentTrack - 1);
    }
  };

  return (
    <div className={compact ? '' : 'bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm'}>
      <div className="flex items-center justify-between mb-3">
        <button 
          onClick={() => setShowPlaylist(!showPlaylist)}
          className="text-text-muted hover:text-primary transition flex items-center gap-2 text-[12px] uppercase font-bold tracking-widest cursor-pointer"
        >
          <ListMusic size={15} /> Playlist
        </button>
        <div className="text-[11px] text-text-muted font-medium bg-bg-surface px-2 py-1 rounded-md border border-border-default max-w-[150px] truncate" title={tracks[currentTrack].name}>
          {tracks[currentTrack].name}
        </div>
      </div>
      
      <audio 
        ref={audioRef} 
        src={tracks[currentTrack].url} 
        loop 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)}
      />

      <div className="flex flex-col gap-4">
        {/* Track Selection */}
        {showPlaylist && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {tracks.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setCurrentTrack(idx);
                    setIsPlaying(true);
                    setTimeout(() => {
                      audioRef.current?.play().catch(() => setIsPlaying(false));
                    }, 50);
                  }}
                  className={`px-3 py-2 rounded-lg text-[12px] font-medium transition cursor-pointer flex justify-between items-center group ${
                    currentTrack === idx 
                      ? 'bg-primary/10 text-primary border border-primary/30' 
                      : 'bg-bg-surface border-border-default text-text-muted hover:text-text-primary border'
                  }`}
                >
                  <span className="truncate max-w-[200px] flex-1 text-left">{track.name}</span>
                  <div className="flex items-center gap-2">
                    {currentTrack === idx && isPlaying && <Music size={12} className="animate-pulse shrink-0" />}
                    {track.id.startsWith('custom-') && (
                      <button
                        onClick={(e) => handleDeleteTrack(idx, e)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition cursor-pointer"
                        title="Delete track"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add custom URL form */}
            <form onSubmit={addCustomTrack} className="flex items-center gap-2 mt-1">
              <input 
                type="url" 
                placeholder="Paste audio URL..." 
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-[11px] text-text-primary outline-none focus:border-primary transition"
                required
              />
              <button 
                type="submit" 
                className="bg-bg-surface border border-border-default hover:border-primary hover:text-primary text-text-secondary w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer shrink-0"
                title="Add Track"
              >
                <Plus size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-primary transition cursor-pointer hover:bg-bg-surface">
              <SkipBack size={16} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all shrink-0"
            >
              {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-1" />}
            </button>
            <button onClick={handleNext} className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-primary transition cursor-pointer hover:bg-bg-surface">
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center gap-3 bg-bg-surface px-4 py-3 rounded-xl border border-border-default">
            {volume === 0 ? <VolumeX size={16} className="text-text-muted shrink-0" /> : <Volume2 size={16} className="text-text-muted shrink-0" />}
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border-default rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Wellbeing = () => {
  const { t } = useTranslation();
  const [mood, setMood] = useState('good');
  const token = useSelector(state => state.auth?.token);
  const [studyStats, setStudyStats] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/v1/silent-library/stats/me`, { headers: authHeaders })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStudyStats(d))
      .catch(() => {});
  }, [token]);

  const getMoodAlert = () => {
    if (mood === 'burnt') return { bg: 'bg-[#FBEEED]', text: 'text-[#9C2E24]', msg: 'Please take a break. Overstudying reduces net retention.' };
    if (mood === 'okay') return { bg: 'bg-[#FDF9F5]', text: 'text-[#9C6F12]', msg: 'Pacing is key. Keep your sessions light today.' };
    if (mood === 'focused') return { bg: 'bg-[#E6F3FB]', text: 'text-[#1565C0]', msg: 'Excellent state of mind. Tackle your hardest GS topics now!' };
    return { bg: 'bg-[#EBF5F0]', text: 'text-[#2B7A4B]', msg: t('wellbeing.moodAlert') };
  };

  const { bg, text, msg } = getMoodAlert();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('wellbeing.subtitle')} subtitle={t('wellbeing.desc')} />

      {/* Focus Room */}
      <FocusRoom />

      {/* Row 2: Mood (wider) + Stats (narrower) */}
      <div className="grid grid-cols-[3fr_2fr] gap-6 items-start">
        {/* Mood Tracker */}
        <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
          <h4 className="font-serif font-semibold text-text-primary mb-1">{t('wellbeing.moodQ')}</h4>
          <p className="text-[11px] text-text-muted mb-5">{t('wellbeing.moodSub')}</p>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { key: 'burnt', emoji: '😩', label: t('wellbeing.mood1'), border: 'border-[#D34335]', activeBg: 'bg-[#FBEEED]' },
              { key: 'okay', emoji: '😐', label: t('wellbeing.mood2'), border: 'border-[#C0933C]', activeBg: 'bg-[#FDF9F5]' },
              { key: 'good', emoji: '😊', label: t('wellbeing.mood3'), border: 'border-[#D4613C]', activeBg: 'bg-[#fbefe9]' },
              { key: 'focused', emoji: '🔥', label: t('wellbeing.mood4'), border: 'border-[#3C8157]', activeBg: 'bg-[#EBF5F0]' },
            ].map(m => (
              <div key={m.key} onClick={() => setMood(m.key)}
                className={`border py-5 px-3 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition hover:bg-bg-panel-hover ${
                  mood === m.key ? `${m.border} ${m.activeBg}` : 'border-border-default bg-bg-panel'
                }`}>
                <span className="text-[28px]">{m.emoji}</span>
                <span className={`text-[12px] text-center leading-snug ${mood === m.key ? 'text-text-primary font-medium' : 'text-text-muted'}`}>{m.label}</span>
              </div>
            ))}
          </div>
          <div className={`p-4 rounded-xl font-medium text-[13px] leading-relaxed ${bg} ${text}`}>{msg}</div>
        </div>

        {/* Study Stats */}
        <StudyStatsCard stats={studyStats} />
      </div>

      {/* Row 3: Reality Check + Recovery tips side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Reality Check */}
        <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
          <h4 className="font-serif font-semibold text-text-primary mb-4">{t('wellbeing.realityTitle')}</h4>
          <div className="bg-[#fbefe9] p-5 rounded-xl border border-[#EED4C3] text-[#9C4528]">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] flex items-center gap-1.5 mb-2">
              <Activity size={11} /> {t('wellbeing.insightTitle')}
            </div>
            <p className="text-[13px] leading-[1.7]">{t('wellbeing.insightText')}</p>
          </div>
        </div>

        {/* Recovery tips */}
        <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
          <h4 className="font-serif font-semibold text-text-primary mb-1">{t('wellbeing.slowTitle')}</h4>
          <p className="text-[11px] text-text-muted leading-[1.6] mb-5">{t('wellbeing.slowDesc')}</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: <Coffee size={14} />, text: '10-min walk without phone' },
              { icon: <CheckCircle2 size={14} />, text: 'Review yesterday\'s notes (20 min)' },
              { icon: <BookOpen size={14} />, text: 'Light reading — newspaper editorial' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-bg-panel-hover rounded-lg px-4 py-3 text-[13px] text-text-secondary">
                <span className="text-primary shrink-0">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Stories full-width */}
      <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-serif font-semibold text-text-primary text-[18px]">{t('wellbeing.storiesTitle')}</h3>
          <span className="text-[11px] text-text-muted">{t('wellbeing.storiesSub')}</span>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {[
            { text: t('wellbeing.story1Text'), author: t('wellbeing.story1Author'), meta: t('wellbeing.story1Meta') },
            { text: t('wellbeing.story2Text'), author: t('wellbeing.story2Author'), meta: t('wellbeing.story2Meta') },
            { text: t('wellbeing.story3Text'), author: t('wellbeing.story3Author'), meta: t('wellbeing.story3Meta') },
          ].map((s, i) => (
            <div key={i} className="bg-[#f4f3ef] p-5 rounded-xl flex flex-col">
              <p className="italic text-[13px] text-text-primary leading-[1.6] flex-1 mb-5">{s.text}</p>
              <div>
                <div className="text-[13px] font-semibold text-text-primary">{s.author}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{s.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wellbeing;
