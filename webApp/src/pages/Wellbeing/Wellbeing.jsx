import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Play, Pause, BookOpen, Users, Clock, Zap,
  CheckCircle2, Coffee, FlameIcon, Activity, Loader2,
  Volume2, VolumeX, Music, SkipBack, SkipForward, ListMusic, Plus, Trash2,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// ─── Focus Room (Silent Library + Pomodoro, merged) ──────────────────────────

const FocusRoom = () => {
  const { t } = useTranslation();
  const token = useSelector(state => state.auth?.token);

  // ── Silent Library state ────────────────────────────────────────────────────
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [activeUserList, setActiveUserList] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [lastEarned, setLastEarned] = useState(null);
  const [libError, setLibError] = useState('');
  const sessionTimerRef = useRef(null);

  const isInLibraryRef = useRef(false);
  const tokenRef = useRef(token);
  useEffect(() => { isInLibraryRef.current = isInLibrary; }, [isInLibrary]);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Pomodoro state ──────────────────────────────────────────────────────────
  const [pomTime, setPomTime] = useState(25 * 60);
  const [pomActive, setPomActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomos, setCompletedPomos] = useState(0);
  const pomBaseRef = useRef(25 * 60);

  // ── Silent Library API helpers ──────────────────────────────────────────────
  const fetchActive = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/active`);
      if (r.ok) { const d = await r.json(); setActiveUsers(d.count ?? 0); setActiveUserList(d.users ?? []); }
    } catch (_) {}
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/history/me?limit=5`, { headers: authHeaders });
      if (r.ok) { const all = await r.json(); setSessionHistory(all.filter(s => s.end_time && s.duration_minutes > 0)); }
    } catch (_) {}
  }, [token]);

  const checkAndResumeSession = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/history/me?limit=1`, { headers: authHeaders });
      if (!r.ok) return;
      const sessions = await r.json();
      if (sessions.length > 0 && !sessions[0].end_time) {
        const startTime = new Date(sessions[0].start_time);
        const elapsed = Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000));
        setIsInLibrary(true); setSessionStart(startTime); setSessionElapsed(elapsed);
      }
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    fetchActive(); fetchHistory(); checkAndResumeSession();
    const poll = setInterval(fetchActive, 30000);
    return () => clearInterval(poll);
  }, [fetchActive, fetchHistory, checkAndResumeSession]);

  // Auto-leave on tab hide
  useEffect(() => {
    if (!isInLibrary) return;
    const onHide = () => { if (document.hidden) leaveLibrary(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInLibrary]);

  // Auto-leave on page close / React Router navigation
  useEffect(() => {
    const leaveOnUnload = () => {
      if (!isInLibraryRef.current || !tokenRef.current) return;
      fetch(`${API_BASE}/api/v1/silent-library/leave`, { method: 'POST', headers: { Authorization: `Bearer ${tokenRef.current}` }, keepalive: true });
    };
    window.addEventListener('beforeunload', leaveOnUnload);
    return () => { window.removeEventListener('beforeunload', leaveOnUnload); leaveOnUnload(); };
  }, []);

  // Session elapsed timer
  useEffect(() => {
    if (isInLibrary) { sessionTimerRef.current = setInterval(() => setSessionElapsed(s => s + 1), 1000); }
    else { clearInterval(sessionTimerRef.current); }
    return () => clearInterval(sessionTimerRef.current);
  }, [isInLibrary]);

  // Pomodoro countdown
  useEffect(() => {
    if (!pomActive) return;
    if (pomTime <= 0) {
      setPomActive(false);
      if (!isBreak) setCompletedPomos(c => c + 1);
      return;
    }
    const t = setTimeout(() => setPomTime(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [pomActive, pomTime, isBreak]);

  const joinLibrary = async () => {
    if (!token) { setLibError('Please log in to join.'); return; }
    setLibError(''); setIsJoining(true);
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/join`, { method: 'POST', headers: authHeaders });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || 'Failed to join'); }
      const data = await r.json();
      const startTime = new Date(data.start_time);
      setIsInLibrary(true); setSessionStart(startTime);
      setSessionElapsed(Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000)));
      setLastEarned(null); fetchActive();
    } catch (e) { setLibError(e.message); } finally { setIsJoining(false); }
  };

  const leaveLibrary = async () => {
    setLibError(''); setIsLeaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/leave`, { method: 'POST', headers: authHeaders });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || 'Failed to leave'); }
      const data = await r.json();
      setIsInLibrary(false);
      setLastEarned({ minutes: data.duration_minutes, points: data.duration_minutes * 2 });
      setSessionElapsed(0); fetchActive(); fetchHistory();
    } catch (e) { setLibError(e.message); } finally { setIsLeaving(false); }
  };

  const setPomSession = (mins, breakMode) => {
    setPomActive(false); setIsBreak(breakMode);
    pomBaseRef.current = mins * 60; setPomTime(mins * 60);
  };

  const formatSecs = (secs) => {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const xpPerMinute = 2;
  const projectedXP = Math.floor(sessionElapsed / 60) * xpPerMinute;
  const pomPct = (pomTime / pomBaseRef.current) * 100;
  const pomColor = isBreak ? '#2B7A4B' : 'var(--color-primary)';
  const circumference = 2 * Math.PI * 56;

  return (
    <div className="bg-bg-surface-dark text-text-primary rounded-2xl overflow-hidden shadow-lg">
      {/* ── Header ── */}
      <div className="relative px-8 pt-7 pb-5 flex items-center justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(600px_200px_at_0%_50%,_var(--color-primary),_transparent_70%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={17} className="text-primary" />
            <span className="text-[10px] tracking-[3px] uppercase font-bold text-primary">Focus Room</span>
          </div>
          <h3 className="font-serif text-[22px] font-semibold">Silent Library + Pomodoro</h3>
          <p className="text-text-muted text-[12px] mt-0.5">Join the library to earn XP · use Pomodoro to stay on track</p>
        </div>
        {/* Stats row inline */}
        <div className="relative flex items-center gap-6 text-center">
          <div>
            <div className="flex items-center gap-1 text-text-muted text-[10px] justify-center mb-0.5"><Users size={11} /> Studying</div>
            <div className="text-[22px] font-serif font-semibold">{activeUsers + (isInLibrary ? 1 : 0)}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="flex items-center gap-1 text-text-muted text-[10px] justify-center mb-0.5"><Clock size={11} /> Session</div>
            <div className="text-[22px] font-serif font-mono font-semibold">{isInLibrary ? formatSecs(sessionElapsed) : '—'}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="flex items-center gap-1 text-text-muted text-[10px] justify-center mb-0.5"><Zap size={11} /> XP</div>
            <div className="text-[22px] font-serif font-semibold text-primary">{isInLibrary ? `+${projectedXP}` : '—'}</div>
          </div>
        </div>
      </div>

      {/* ── Main body: two columns ── */}
      <div className="grid grid-cols-[1fr_1px_1fr] border-t border-white/10">

        {/* Left: Pomodoro */}
        <div className="px-8 py-7 flex flex-col items-center gap-5">
          <div className="text-[10px] tracking-[3px] uppercase text-text-muted flex items-center gap-2">
            {isBreak ? 'BREAK' : t('wellbeing.focusTitle')}
            {completedPomos > 0 && <span className="text-primary font-semibold">● {completedPomos} done</span>}
          </div>

          {/* Ring */}
          <div className="relative w-44 h-44">
            <style>{`
              @keyframes pom-pulse {
                0%,100% { filter: drop-shadow(0 0 4px ${pomColor}); }
                50% { filter: drop-shadow(0 0 16px ${pomColor}); }
              }
              .pom-active { animation: pom-pulse 2s ease-in-out infinite; }
            `}</style>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
              <circle
                cx="64" cy="64" r="56" fill="none"
                stroke={pomColor} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pomPct / 100)}
                className={`transition-all duration-1000 ${pomActive ? 'pom-active' : ''}`}
                style={{ color: pomColor }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[36px] font-mono font-semibold leading-none">{formatSecs(pomTime)}</div>
              <div className="text-[10px] text-text-muted mt-1.5 tracking-[2px]">{isBreak ? 'BREAK' : 'FOCUS'}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button onClick={() => setPomSession(25, false)}
              className="bg-white/5 border border-white/10 text-text-secondary px-4 py-2 rounded-lg text-[12px] cursor-pointer hover:bg-white/15 hover:text-text-primary transition">
              {t('wellbeing.focus25')}
            </button>
            <button
              onClick={() => setPomActive(a => !a)}
              className={`px-6 py-2.5 rounded-lg text-[14px] font-medium flex items-center gap-2 cursor-pointer transition shadow-lg ${
                isBreak ? 'bg-[#2B7A4B] hover:bg-[#3a9e64] shadow-[#2B7A4B]/20' : 'bg-primary hover:bg-primary-hover shadow-primary/20'
              } text-white`}
            >
              {pomActive ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
              {pomActive ? 'Pause' : t('wellbeing.focusStart')}
            </button>
            <button onClick={() => setPomSession(5, true)}
              className="bg-white/5 border border-white/10 text-text-secondary px-4 py-2 rounded-lg text-[12px] cursor-pointer hover:bg-white/15 hover:text-text-primary transition">
              {t('wellbeing.focusBreak')}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="bg-white/10" />

        {/* Right: Library controls */}
        <div className="px-8 py-7 flex flex-col gap-4">
          <div className="text-[10px] tracking-[3px] uppercase text-text-muted mb-1">Library Session</div>

          {lastEarned && (
            <div className="bg-[#EBF5F0]/15 border border-[#2B7A4B]/40 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[#6BCB97] text-[13px] font-semibold">
                Session complete! {lastEarned.minutes} min → <span className="text-primary">+{lastEarned.points} XP</span>
              </div>
            </div>
          )}

          {libError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-[12px]">{libError}</div>
          )}

          {!isInLibrary ? (
            <button onClick={joinLibrary} disabled={isJoining}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60 shadow-lg shadow-primary/20 w-full">
              {isJoining ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="white" />}
              {isJoining ? 'Joining...' : 'Join Silent Library'}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-text-muted text-[10px] mb-1 uppercase tracking-widest">In session</div>
                <div className="font-mono text-[34px] font-semibold leading-none">{formatSecs(sessionElapsed)}</div>
                {sessionElapsed > 0 && <div className="text-primary text-[11px] mt-1.5">+{projectedXP} XP so far</div>}
              </div>
              <button onClick={leaveLibrary} disabled={isLeaving}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-text-primary px-6 py-2.5 rounded-lg font-medium text-[13px] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 w-full">
                {isLeaving ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
                {isLeaving ? 'Leaving...' : 'End Session & Collect XP'}
              </button>
            </div>
          )}

          {/* Who's studying */}
          {activeUserList.length > 0 && (
            <div className="mt-1">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Studying right now</div>
              <div className="flex flex-wrap gap-1.5">
                {activeUserList.slice(0, 6).map((u, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-primary/30 flex items-center justify-center text-[8px] font-bold text-primary">
                      {(u.name || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-[11px] text-text-secondary">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent sessions */}
          {sessionHistory.length > 0 && (
            <div className="mt-auto pt-3 border-t border-white/10">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Recent sessions</div>
              <div className="flex flex-col gap-1.5">
                {sessionHistory.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">{new Date(s.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className="text-text-primary font-medium">{s.duration_minutes} min</span>
                    <span className="text-primary font-medium">+{(s.duration_minutes || 0) * 2} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Music Player (always visible) ── */}
      <div className="border-t border-white/10 px-8 py-4">
        <MusicPlayer compact />
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
      {/* Header */}
      <div>
        <h2 className="font-serif text-[24px] font-semibold">{t('wellbeing.subtitle')}</h2>
        <p className="text-text-muted text-[13px] mt-1">{t('wellbeing.desc')}</p>
      </div>

      {/* Focus Room — Silent Library + Pomodoro merged */}
      <FocusRoom />

      {/* Second row */}
      <div className="flex gap-6 items-start">
        {/* Left: Mood */}
        <div className="flex-[1.3] flex flex-col gap-6">
          {/* Mood Tracker */}
          <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
            <h4 className="font-serif font-semibold text-text-primary mb-1">{t('wellbeing.moodQ')}</h4>
            <p className="text-[11px] text-text-muted mb-4">{t('wellbeing.moodSub')}</p>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { key: 'burnt', emoji: '😩', label: t('wellbeing.mood1'), border: 'border-[#D34335]', activeBg: 'bg-[#FBEEED]' },
                { key: 'okay', emoji: '😐', label: t('wellbeing.mood2'), border: 'border-[#C0933C]', activeBg: 'bg-[#FDF9F5]' },
                { key: 'good', emoji: '😊', label: t('wellbeing.mood3'), border: 'border-[#D4613C]', activeBg: 'bg-[#fbefe9]' },
                { key: 'focused', emoji: '🔥', label: t('wellbeing.mood4'), border: 'border-[#3C8157]', activeBg: 'bg-[#EBF5F0]' },
              ].map(m => (
                <div
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  className={`border py-5 px-3 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition hover:bg-bg-panel-hover ${
                    mood === m.key ? `${m.border} ${m.activeBg}` : 'border-border-default bg-bg-panel'
                  }`}
                >
                  <span className="text-[26px]">{m.emoji}</span>
                  <span className={`text-[12px] text-center ${mood === m.key ? 'text-text-primary font-medium' : 'text-text-muted'}`}>{m.label}</span>
                </div>
              ))}
            </div>
            <div className={`p-4 rounded-lg font-medium text-[13px] ${bg} ${text}`}>{msg}</div>
          </div>

        </div>

        {/* Right: Stats + Wellbeing tips */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Study stats (live from API) */}
          <StudyStatsCard stats={studyStats} />

          {/* Reality Check (static motivation) */}
          <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
            <h4 className="font-serif font-semibold text-text-primary mb-4">{t('wellbeing.realityTitle')}</h4>
            <div className="bg-[#fbefe9] p-5 rounded-xl border border-[#EED4C3] text-[#9C4528]">
              <div className="text-[10px] font-semibold uppercase tracking-[1px] flex items-center gap-1.5 mb-2">
                <Activity size={11} /> {t('wellbeing.insightTitle')}
              </div>
              <p className="text-[13px] leading-[1.6]">{t('wellbeing.insightText')}</p>
            </div>
          </div>

          {/* Slow week (actionable) */}
          <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
            <h4 className="font-serif font-semibold text-text-primary mb-2">{t('wellbeing.slowTitle')}</h4>
            <p className="text-[11px] text-text-muted leading-[1.6] mb-4">{t('wellbeing.slowDesc')}</p>
            <div className="flex flex-col gap-2">
              {[
                { icon: <Coffee size={13} />, text: '10-min walk without phone' },
                { icon: <CheckCircle2 size={13} />, text: 'Review yesterday\'s notes (20 min)' },
                { icon: <BookOpen size={13} />, text: 'Light reading — newspaper editorial' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[12px] text-text-secondary">
                  <span className="text-primary">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stories */}
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
            <div key={i} className="bg-[#f4f3ef] p-5 rounded-xl">
              <p className="italic text-[13px] text-text-primary leading-[1.6] mb-5">{s.text}</p>
              <div className="text-[13px] font-semibold text-text-primary">{s.author}</div>
              <div className="text-[11px] text-text-muted mt-1">{s.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wellbeing;
