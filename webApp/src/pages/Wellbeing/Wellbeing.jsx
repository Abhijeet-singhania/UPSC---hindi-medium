import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Play, Pause, BookOpen, Users, Clock, Zap, TrendingUp,
  CheckCircle2, Coffee, FlameIcon, Activity, Loader2,
  Volume2, VolumeX, Music, SkipBack, SkipForward, ListMusic, Plus, Trash2,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// ─── Silent Library ──────────────────────────────────────────────────────────

const SilentLibrary = () => {
  const token = useSelector(state => state.auth?.token);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [activeUserList, setActiveUserList] = useState([]);
  const [studyStats, setStudyStats] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [lastEarned, setLastEarned] = useState(null);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchActive = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/active`);
      if (r.ok) {
        const d = await r.json();
        setActiveUsers(d.count ?? 0);
        setActiveUserList(d.users ?? []);
      }
    } catch (_) {}
  }, []);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/stats/me`, { headers: authHeaders });
      if (r.ok) setStudyStats(await r.json());
    } catch (_) {}
  }, [token]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/history/me?limit=5`, { headers: authHeaders });
      if (r.ok) setSessionHistory(await r.json());
    } catch (_) {}
  }, [token]);

  // Check if user already has an active session on mount
  useEffect(() => {
    fetchActive();
    fetchStats();
    fetchHistory();
    // Poll active users every 30s
    const poll = setInterval(fetchActive, 30000);
    return () => clearInterval(poll);
  }, [fetchActive, fetchStats, fetchHistory]);

  // Elapsed timer
  useEffect(() => {
    if (isInLibrary) {
      timerRef.current = setInterval(() => setSessionElapsed(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isInLibrary]);

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const joinLibrary = async () => {
    if (!token) { setError('Please log in to join the Silent Library.'); return; }
    setError('');
    setIsJoining(true);
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/join`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.detail || 'Failed to join');
      }
      setIsInLibrary(true);
      setSessionElapsed(0);
      setLastEarned(null);
      fetchActive();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsJoining(false);
    }
  };

  const leaveLibrary = async () => {
    setError('');
    setIsLeaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/v1/silent-library/leave`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.detail || 'Failed to leave');
      }
      const data = await r.json();
      setIsInLibrary(false);
      setLastEarned({ minutes: data.duration_minutes, points: data.duration_minutes * 2 });
      setSessionElapsed(0);
      fetchActive();
      fetchStats();
      fetchHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLeaving(false);
    }
  };

  const xpPerMinute = 2;
  const projectedXP = Math.floor(sessionElapsed / 60) * xpPerMinute;

  return (
    <div className="bg-bg-surface-dark text-text-primary rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="relative px-8 pt-8 pb-6 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(600px_300px_at_50%_0%,_var(--color-primary),_transparent_70%)]" />
        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen size={20} className="text-primary" />
            <span className="text-[10px] tracking-[3px] uppercase font-bold text-primary">Silent Library</span>
          </div>
          <h3 className="font-serif text-[26px] font-semibold mb-2">Deep Work Room</h3>
          <p className="text-text-muted text-[13px] max-w-md">
            Study in focused silence with fellow aspirants. Every minute earns you <strong className="text-primary">{xpPerMinute} XP</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
        <div className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-text-muted text-[11px] mb-1">
            <Users size={12} /> Currently studying
          </div>
          <div className="text-[28px] font-serif font-semibold">
            {activeUsers + (isInLibrary ? 0 : 0)}
          </div>
        </div>
        <div className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-text-muted text-[11px] mb-1">
            <Clock size={12} /> Your session
          </div>
          <div className="text-[28px] font-serif font-semibold font-mono">
            {isInLibrary ? formatElapsed(sessionElapsed) : '—'}
          </div>
        </div>
        <div className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-text-muted text-[11px] mb-1">
            <Zap size={12} /> XP this session
          </div>
          <div className="text-[28px] font-serif font-semibold text-primary">
            {isInLibrary ? `+${projectedXP}` : '—'}
          </div>
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col items-center gap-4">
        {lastEarned && (
          <div className="bg-[#EBF5F0]/20 border border-[#2B7A4B]/40 rounded-xl px-6 py-3 text-center">
            <div className="text-[#6BCB97] text-sm font-semibold">
              Session complete! {lastEarned.minutes} min → <span className="text-primary">+{lastEarned.points} XP</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-[13px]">
            {error}
          </div>
        )}

        {!isInLibrary ? (
          <button
            onClick={joinLibrary}
            disabled={isJoining}
            className="bg-primary hover:bg-primary-hover text-white px-10 py-3.5 rounded-xl font-semibold text-[15px] flex items-center gap-3 transition cursor-pointer disabled:opacity-60 shadow-lg shadow-primary/20"
          >
            {isJoining ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="white" />}
            {isJoining ? 'Joining...' : 'Join Silent Library'}
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <div className="w-full bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-text-muted text-[11px] mb-1 uppercase tracking-widest">In session</div>
              <div className="font-mono text-[38px] font-semibold leading-none">{formatElapsed(sessionElapsed)}</div>
              {sessionElapsed > 0 && (
                <div className="text-primary text-[12px] mt-2">+{projectedXP} XP earned so far</div>
              )}
            </div>
            <button
              onClick={leaveLibrary}
              disabled={isLeaving}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-text-primary px-8 py-2.5 rounded-lg font-medium text-[13px] flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {isLeaving ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
              {isLeaving ? 'Leaving...' : 'End Session & Collect XP'}
            </button>
          </div>
        )}

        {/* Active users list */}
        {activeUserList.length > 0 && (
          <div className="w-full mt-2">
            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2 text-center">
              Who's studying right now
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {activeUserList.slice(0, 8).map((u, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  <div className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center text-[9px] font-bold text-primary">
                    {(u.name || 'U').substring(0, 1).toUpperCase()}
                  </div>
                  <span className="text-[11px] text-text-secondary">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Study history */}
      {sessionHistory.length > 0 && (
        <div className="border-t border-white/10 px-8 py-5">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Recent sessions</div>
          <div className="flex flex-col gap-2">
            {sessionHistory.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-text-muted">{new Date(s.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span className="text-text-primary font-medium">{s.duration_minutes} min</span>
                <span className="text-primary">+{(s.duration_minutes || 0) * 2} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────

const PomodoroTimer = () => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (!isBreak) setCompletedSessions(s => s + 1);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const handleToggleActive = () => {
    if (!isActive) {
      if (containerRef.current && !document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
    setIsActive(!isActive);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  
  const setSession = (mins, breakMode) => {
    setIsActive(false);
    setIsBreak(breakMode);
    setTimeLeft(mins * 60);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };
  
  const pct = isBreak ? (timeLeft / (5 * 60)) * 100 : (timeLeft / (25 * 60)) * 100;

  return (
    <div ref={containerRef} className="bg-bg-surface-dark text-text-primary rounded-2xl p-8 flex flex-col items-center justify-center relative min-h-[300px]">
      <style>
        {`
          @keyframes groovy-glow {
            0% { filter: drop-shadow(0 0 4px currentColor); transform: scale(1); }
            50% { filter: drop-shadow(0 0 20px currentColor); transform: scale(1.05) rotate(5deg); }
            100% { filter: drop-shadow(0 0 4px currentColor); transform: scale(1); }
          }
          .animate-groovy {
            animation: groovy-glow 3s ease-in-out infinite;
            transform-origin: center;
          }
        `}
      </style>
      <div className="text-[10px] tracking-[3px] uppercase text-text-muted mb-4">
        {isBreak ? 'BREAK SESSION' : t('wellbeing.focusTitle')}
        {completedSessions > 0 && <span className="ml-3 text-primary">● {completedSessions} done</span>}
      </div>

      {/* Circular timer */}
      <div className="relative w-48 h-48 mb-8 mt-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx="72" cy="72" r="60" fill="none"
            stroke={isBreak ? '#2B7A4B' : 'var(--color-primary)'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 60}`}
            strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
            className={`transition-all duration-1000 ${isActive ? 'animate-groovy text-current' : 'text-current'}`}
            style={{ color: isBreak ? '#2B7A4B' : 'var(--color-primary)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[40px] font-mono font-semibold leading-none">{formatTime(timeLeft)}</div>
          <div className="text-[11px] text-text-muted mt-2 tracking-[2px]">{isBreak ? 'BREAK' : 'FOCUS'}</div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          className="bg-white/5 border border-white/10 text-text-secondary px-6 py-3 rounded-lg text-[13px] cursor-pointer hover:bg-white/15 hover:text-text-primary transition"
          onClick={() => setSession(25, false)}
        >
          {t('wellbeing.focus25')}
        </button>
        <button
          className={`px-8 py-3 rounded-lg text-[15px] font-medium flex items-center gap-2 cursor-pointer transition shadow-lg ${
            isBreak ? 'bg-[#2B7A4B] hover:bg-[#3a9e64] shadow-[#2B7A4B]/20' : 'bg-primary hover:bg-primary-hover shadow-primary/20'
          } text-white`}
          onClick={handleToggleActive}
        >
          {isActive ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
          {isActive ? 'Pause' : t('wellbeing.focusStart')}
        </button>
        <button
          className="bg-white/5 border border-white/10 text-text-secondary px-6 py-3 rounded-lg text-[13px] cursor-pointer hover:bg-white/15 hover:text-text-primary transition"
          onClick={() => setSession(5, true)}
        >
          {t('wellbeing.focusBreak')}
        </button>
      </div>

      {isFullscreen && (
        <div className="w-[340px] absolute left-12 top-1/2 -translate-y-1/2">
          <MusicPlayer />
        </div>
      )}
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

const MusicPlayer = () => {
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
    <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
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

      {/* Silent Library — full width, most prominent */}
      <SilentLibrary />

      {/* Second row */}
      <div className="flex gap-6 items-start">
        {/* Left: Mood + Pomodoro */}
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

          {/* Pomodoro */}
          <PomodoroTimer />
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
