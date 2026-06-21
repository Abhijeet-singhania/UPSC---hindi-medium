import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Trophy, Flame, ArrowRight,
  PenLine, BookOpen, Users, Dumbbell, Heart, Sparkles,
  Target, Zap,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { Badge, Reveal } from '../../components/ui';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const GS_ACCENT = { GS1: 'gs1', GS2: 'gs2', GS3: 'gs3', GS4: 'gs4', Essay: 'primary' };

const _recIcon = (type) => {
  const map = {
    answer_writing: <PenLine size={15} />,
    prelims_weak:   <Dumbbell size={15} />,
    prelims_focus:  <Dumbbell size={15} />,
    current_affairs:<BookOpen size={15} />,
    ask_ai:         <Sparkles size={15} />,
    wellbeing:      <Heart size={15} />,
    community:      <Users size={15} />,
  };
  return map[type] || <ArrowRight size={15} />;
};

/* UPSC CSE Prelims 2027 — update this each cycle */
const EXAM_DATE = new Date('2027-05-25T00:00:00');
const EXAM_LABEL = 'UPSC CSE Prelims 2027';

function useCountdown(targetDate) {
  const [diff, setDiff] = useState(() => Math.max(0, targetDate - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, targetDate - Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

/* Heatmap cell colors — saffron scale */
const heatStyle = {
  1: { background: 'rgba(196,144,42,0.06)', border: '1px solid rgba(196,144,42,0.08)' },
  2: { background: 'rgba(196,144,42,0.22)', border: '1px solid rgba(196,144,42,0.15)' },
  3: { background: 'rgba(196,144,42,0.45)', border: 'none' },
  4: { background: 'rgba(196,144,42,0.7)',  border: 'none' },
  5: { background: '#C4902A',               border: 'none' },
};

/* ── GS Mastery Ring ── */
const MasteryRing = ({ label, percent, color, size = 72 }) => {
  const r = (size - 10) / 2;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - Math.min(percent, 100) / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="cc-mono text-[14px] font-bold" style={{ color }}>{percent}%</span>
        </div>
      </div>
      <span className="cc-section-label text-[8px]" style={{ color }}>{label}</span>
    </div>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useSelector(state => state.auth);
  const userId = user?.id;
  const countdown = useCountdown(EXAM_DATE);

  const { data: userStats, isLoading: loadingStats, execute: fetchStats } = useApi(`${API_BASE}/api/v1/users/:userId/stats`);
  const { data: leaderboardData, isLoading: loadingLeaderboard, execute: fetchLeaderboard } = useApi(`${API_BASE}/api/v1/leaderboard/reputation`);
  const { data: todayCA, execute: fetchTodayCA } = useApi(`${API_BASE}/api/v1/affairs/today`);
  const { data: todayQuestion, execute: fetchTodayQuestion } = useApi(`${API_BASE}/api/v1/daily/questions/today`);

  useEffect(() => {
    if (userId) fetchStats({ pathParams: { userId } }).catch(() => {});
    fetchLeaderboard({ queryParams: { limit: 5 } }).catch(() => {});
    fetchTodayCA().catch(() => {});
    fetchTodayQuestion().catch(() => {});
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const caItems = Array.isArray(todayCA) ? todayCA.slice(0, 3) : [];
  const leaderboard = leaderboardData?.leaderboard || [];
  const displayName = user?.name || user?.email?.split('@')[0] || 'Aspirant';
  const reputation  = userStats?.reputation ?? user?.reputation ?? 0;
  const streak      = userStats?.streak_days ?? user?.streak_days ?? 0;
  const answersGiven = userStats?.answers_given ?? 0;
  const studyMinutes = userStats?.total_study_minutes ?? 0;
  const studyHours   = Math.round(studyMinutes / 60);

  const [aiRecs, setAiRecs] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoadingRecs(true);
    fetch(`${API_BASE}/api/v1/ai/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.recommendations) setAiRecs(data.recommendations); })
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, [userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const [heatmapData, setHeatmapData] = useState(
    Array.from({ length: 7 }, () => Array(8).fill(1))
  );

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/v1/silent-library/history/me?limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(sessions => {
        const dateMap = {};
        for (const s of sessions) {
          if (!s.start_time || !s.duration_minutes) continue;
          const dateStr = s.start_time.substring(0, 10);
          dateMap[dateStr] = (dateMap[dateStr] || 0) + s.duration_minutes;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDow = (today.getDay() + 6) % 7;
        const mondayThisWeek = new Date(today);
        mondayThisWeek.setDate(today.getDate() - currentDow);
        const grid = Array.from({ length: 7 }, () => Array(8).fill(1));
        for (let c = 0; c < 8; c++) {
          const weekMonday = new Date(mondayThisWeek);
          weekMonday.setDate(mondayThisWeek.getDate() - (7 - c) * 7);
          for (let r = 0; r < 7; r++) {
            const date = new Date(weekMonday);
            date.setDate(weekMonday.getDate() + r);
            if (date > today) continue;
            const mins = dateMap[date.toISOString().substring(0, 10)] || 0;
            grid[r][c] = mins === 0 ? 1 : mins <= 30 ? 2 : mins <= 60 ? 3 : mins <= 120 ? 4 : 5;
          }
        }
        setHeatmapData(grid);
      })
      .catch(() => {});
  }, [userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const planItems = (aiRecs && aiRecs.length > 0
    ? aiRecs.map(rec => ({ icon: _recIcon(rec.type), label: rec.label, sub: rec.reason, route: rec.route }))
    : [
        { icon: <PenLine size={15} />,   label: 'Daily Answer Writing',    sub: "Today's prompt · 30 min",                   route: '/answers' },
        { icon: <Dumbbell size={15} />,  label: 'Practice Prelims MCQs',   sub: 'Prelims Lab · 30-question set · 45 min',    route: '/prelims' },
        { icon: <Users size={15} />,     label: 'Browse Community Q&A',    sub: 'Community tab · Answer a doubt',            route: '/community' },
        { icon: <Heart size={15} />,     label: 'Silent Study Session',     sub: 'Wellbeing · Focus with peers',              route: '/wellbeing' },
      ]
  );

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  // GS completion percentages (static for now, can be made dynamic)
  const gsData = [
    { label: 'GS 1', percent: 75, color: '#C4902A' },
    { label: 'GS 2', percent: 82, color: '#3B6CC4' },
    { label: 'GS 3', percent: 46, color: '#2D8A5E' },
    { label: 'GS 4', percent: 60, color: '#9B4ECA' },
  ];

  return (
    <div className="relative w-full">
      {/* ── Subtle Background glow highlights ── */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[#C4902A]/4 blur-[120px] pointer-events-none -translate-x-12 -translate-y-12" />
      <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-[#3B6CC4]/5 blur-[150px] pointer-events-none translate-x-20" />

      <div className="relative z-10 flex flex-col gap-5">

        {/* ═══ MISSION CLOCK — Full Width Hero ═══ */}
        <Reveal delay={0}>
          <div className="cc-panel cc-panel-hover p-5 relative overflow-hidden" data-cursor-type="target">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
              {/* Left: countdown */}
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <div className="flex items-center gap-2 mb-1">
                  <span className="cc-pulse" />
                  <span className="cc-section-label" style={{ color: '#C4902A' }}>
                    <Target size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    {EXAM_LABEL}
                  </span>
                </div>

                {/* Clock Readout */}
                <div className="cc-inset px-5 py-3 flex items-center justify-around sm:justify-start gap-4 sm:gap-6">
                  {[
                    { value: countdown.days,    label: 'Days',  hero: true },
                    { value: countdown.hours,   label: 'Hours' },
                    { value: countdown.minutes, label: 'Min' },
                    { value: countdown.seconds, label: 'Sec' },
                  ].map(({ value, label, hero }) => (
                    <div key={label} className="flex flex-col items-center min-w-[44px]">
                      <span
                        className="cc-clock-digit"
                        style={{ fontSize: hero ? 'clamp(40px, 5vw, 56px)' : 'clamp(26px, 3vw, 38px)' }}
                      >
                        {String(value).padStart(2, '0')}
                      </span>
                      <span className="cc-section-label text-[8px] mt-1">{label}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[13px]" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--text-secondary)' }}>
                  {greeting}, <span style={{ color: '#C4902A', fontWeight: 600 }}>{displayName}</span>. Every day counts.
                </p>
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto sm:min-w-[180px]">
                <button
                  onClick={() => navigate('/roadmap')}
                  data-cursor-type="link"
                  className="cc-btn w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[12px] font-semibold cursor-pointer active:scale-95 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)',
                    border: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {t('dashboard.todaysPlanBtn')} <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => navigate('/affairs')}
                  data-cursor-type="read"
                  className="cc-btn w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[12px] font-semibold cursor-pointer active:scale-97 text-text-secondary"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t('dashboard.todaysCABtn')}
                </button>
                {todayQuestion && (
                  <button
                    onClick={() => navigate('/answers')}
                    data-cursor-type="write"
                    className="cc-btn w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[12px] font-semibold cursor-pointer active:scale-97 text-[#3B6CC4]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <PenLine size={12} /> Write today's answer
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ═══ SPLIT VIEW: Operations (Left) + Status (Right) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">

          {/* ── LEFT: OPERATIONS PANEL ── */}
          <div className="flex flex-col gap-5">

            {/* Today's Mission Brief */}
            <Reveal delay={0.1}>
              <div className="cc-panel cc-panel-hover p-5 relative overflow-hidden" data-cursor-type="write">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 text-text-primary text-[15px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {t('dashboard.todaysPlan')}
                      {token && (
                        <span className="cc-status-pill text-[9px]" style={{ color: '#C4902A', borderColor: 'rgba(196,144,42,0.25)' }}>
                          <Sparkles size={9} /> AI Generated
                        </span>
                      )}
                    </h3>
                    <span className="text-text-muted text-[12px] block mt-0.5">
                      {token ? 'Optimized study agenda based on your optional and weak areas' : 'Suggested daily prep agenda'}
                    </span>
                  </div>
                  {loadingRecs && <Loader2 size={14} className="animate-spin text-text-muted mt-1 shrink-0" />}
                </div>

                {/* Answers Progress Inset */}
                <div className="cc-inset p-3.5 my-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(59,108,196,0.1)', border: '1px solid rgba(59,108,196,0.2)' }}>
                      <PenLine size={16} className="text-[#3B6CC4]" />
                    </div>
                    <div>
                      <span className="cc-section-label text-[#3B6CC4]">Mains Answer Writing</span>
                      <p className="text-text-secondary text-[11px] mt-0.5">Milestone target: 50 answers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start shrink-0">
                    <span className="cc-mono text-[15px] font-bold text-[#3B6CC4]">
                      {answersGiven} <span className="text-[10px] text-text-muted font-normal">posted</span>
                    </span>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59,108,196,0.1)' }}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-[#3B6CC4]"
                        style={{ width: `${Math.min(100, (answersGiven / 50) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Plan Items */}
                <div className="flex flex-col gap-2">
                  {planItems.map(({ icon, label, sub, route }) => (
                    <button
                      key={route}
                      onClick={() => navigate(route)}
                      className="cc-btn group flex gap-3 items-start py-3 px-3.5 rounded-xl text-left w-full cursor-pointer active:scale-[0.99]"
                    >
                      <span className="mt-0.5 shrink-0 p-2 rounded-lg text-[#C4902A] group-hover:scale-105 transition-transform"
                        style={{ background: 'rgba(196,144,42,0.08)' }}>
                        {icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold flex items-center gap-1.5 transition-all duration-150 text-text-primary" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {label}
                          <ArrowRight size={11} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#C4902A]" />
                        </div>
                        <div className="text-[11px] mt-0.5 text-text-secondary" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Current Affairs Intel Feed */}
            <Reveal delay={0.2}>
              <div className="cc-panel cc-panel-hover p-5 relative overflow-hidden" data-cursor-type="read">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-text-primary text-[15px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {t('dashboard.todaysCADigest')}
                  </h3>
                  <button
                    onClick={() => navigate('/affairs')}
                    className="text-[11px] flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition-colors text-[#C4902A] hover:underline"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    View all <ArrowRight size={11} />
                  </button>
                </div>

                {caItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-2.5 py-8 text-center justify-center">
                    <BookOpen size={24} className="opacity-15 text-text-muted" />
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No current affairs published today.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {caItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/affairs/${item.id}`)}
                        className="cc-btn group border-l-[3px] p-3 px-3.5 rounded-xl text-left w-full cursor-pointer"
                        style={{
                          borderLeftColor: `var(--c-${GS_ACCENT[item.gs_paper] ?? 'primary'})`,
                          borderLeftStyle: 'solid',
                        }}
                      >
                        {item.gs_paper && (
                          <Badge variant={GS_ACCENT[item.gs_paper] ?? 'primary'} className="mb-1.5">
                            {item.gs_paper}
                          </Badge>
                        )}
                        <div className="text-[12px] font-bold line-clamp-2 leading-snug group-hover:text-[#C4902A] transition-colors" style={{ color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
                          {item.title}
                        </div>
                        {item.syllabus_links && (
                          <div className="text-[10px] line-clamp-1 mt-1 text-text-secondary">
                            {item.syllabus_links}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            {/* Study Activity Heatmap */}
            <Reveal delay={0.3}>
              <div className="cc-panel cc-panel-hover p-5 relative overflow-hidden" data-cursor-type="library">
                <div className="w-full flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-text-primary text-[14px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {t('dashboard.studyActivity')}
                  </h3>
                  <span className="cc-section-label">{t('dashboard.last8Weeks')}</span>
                </div>

                <div className="flex flex-col md:flex-row gap-5 items-stretch justify-between">
                  {/* Heatmap Grid */}
                  <div className="flex-1 w-full flex flex-col gap-1.5 overflow-x-auto pb-2">
                    {heatmapData.map((row, rIdx) => (
                      <div className="flex gap-1.5 items-center" key={rIdx}>
                        <span className="w-7 shrink-0 cc-section-label text-[9px]">
                          {rIdx === 0 ? 'Mon' : rIdx === 2 ? 'Wed' : rIdx === 4 ? 'Fri' : rIdx === 6 ? 'Sun' : ''}
                        </span>
                        {row.map((level, cIdx) => (
                          <div
                            key={cIdx}
                            className="w-3.5 h-3.5 rounded-[3px] transition-all hover:scale-125 cursor-help"
                            style={heatStyle[level]}
                            title={`Level ${level}`}
                          />
                        ))}
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 mt-3 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="cc-section-label text-[8px]">{t('dashboard.less')}</span>
                      {[1, 2, 3, 4, 5].map(l => (
                        <div key={l} className="w-3 h-3 rounded-[2px]" style={heatStyle[l]} />
                      ))}
                      <span className="cc-section-label text-[8px]">{t('dashboard.more')}</span>
                    </div>
                  </div>

                  {/* Study Hours Console Readout */}
                  <div className="cc-inset p-4 flex flex-col items-center justify-center min-w-[150px] w-full md:w-auto relative overflow-hidden">
                    <span className="cc-section-label text-[#2D8A5E]">Study Hours</span>
                    <span
                      className="cc-mono text-3xl font-bold mt-2"
                      style={{
                        background: 'linear-gradient(135deg, #6ECBA0 0%, #2D8A5E 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {studyHours}h
                    </span>
                    <span className="text-[10px] text-text-secondary text-center mt-1">Total Library</span>
                    <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: 'rgba(45,138,94,0.1)' }}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#2D8A5E]"
                        style={{ width: `${Math.min(100, (studyHours / 100) * 100)}%` }}
                      />
                    </div>
                    <span className="cc-section-label text-[8px] mt-1.5">Target: 100h</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ── RIGHT: STATUS PANEL ── */}
          <div className="flex flex-col gap-5">

            {/* Streak Health Bar */}
            <Reveal delay={0.15}>
              <div className="cc-panel cc-panel-hover p-5 relative overflow-hidden" data-cursor-type="energy">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="cc-section-label" style={{ color: '#C4902A' }}>Momentum</span>
                    <h3 className="font-serif text-xl font-bold mt-1 text-text-primary">Daily Streak</h3>
                  </div>
                  <div className="p-2.5 rounded-xl cc-btn" style={{ border: 'none' }}>
                    <Flame
                      size={22}
                      className="text-[#C4902A] fill-[#C4902A]"
                      style={{ filter: streak >= 7 ? 'drop-shadow(0 0 10px rgba(196,144,42,0.9))' : 'none' }}
                    />
                  </div>
                </div>

                <div className="my-4 flex items-baseline gap-2">
                  <span className="font-serif text-5xl font-black tracking-tight text-gradient-brand">
                    {streak}
                  </span>
                  <div className="flex flex-col">
                    <span className="cc-section-label text-text-primary">Days</span>
                    <span className="cc-section-label text-[8px]">Active</span>
                  </div>
                </div>

                <div className="cc-inset p-3 flex flex-col gap-2">
                  <div className="flex justify-between cc-section-label text-[9px]">
                    <span>Next Milestone</span>
                    <span style={{ color: '#C4902A' }}>{streak}/7 Days</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(196,144,42,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (streak / 7) * 100)}%`,
                        background: 'linear-gradient(90deg, #E8BC5A, #C4902A)',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                    {streak >= 7 ? '🔥 Saffron status activated.' : 'Study daily to grow your streak.'}
                  </p>
                </div>
              </div>
            </Reveal>

            {/* GS Mastery Rings */}
            <Reveal delay={0.25}>
              <div className="cc-panel cc-panel-hover p-5 relative overflow-hidden" data-cursor-type="target">
                <span className="cc-section-label" style={{ color: 'var(--text-muted)' }}>Syllabus Mastery</span>
                <h3 className="font-serif text-lg font-bold mt-1 mb-4 text-text-primary">GS Coverage</h3>
                <div className="flex items-center justify-around">
                  {gsData.map(gs => (
                    <MasteryRing key={gs.label} label={gs.label} percent={gs.percent} color={gs.color} size={68} />
                  ))}
                </div>
                <button
                  onClick={() => navigate('/roadmap')}
                  className="cc-btn w-full mt-4 py-2 px-3 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 text-text-secondary"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  View Full Syllabus Map <ArrowRight size={11} />
                </button>
              </div>
            </Reveal>

            {/* Reputation & Leaderboard */}
            <Reveal delay={0.35}>
              <div className="cc-panel cc-panel-hover p-5 relative overflow-hidden" data-cursor-type="rank">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold flex items-center gap-2 text-text-primary text-[14px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <Trophy size={14} style={{ color: '#C4902A' }} /> Leaders
                  </h3>
                  {loadingLeaderboard && <Loader2 size={13} className="animate-spin text-text-muted shrink-0" />}
                </div>

                {/* Personal Score */}
                <div className="cc-inset p-3 flex items-center justify-between mb-3">
                  <span className="text-[11px] text-text-secondary font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>Your XP:</span>
                  <span className="cc-mono text-[14px] font-bold" style={{ color: '#C4902A' }}>{reputation}</span>
                </div>

                {/* Mini Podium */}
                {leaderboard.length >= 3 && (
                  <div className="flex items-end justify-center gap-2 mb-3 pt-3 border-b pb-3" style={{ borderColor: 'var(--cc-panel-border)' }}>
                    {/* Rank 2 */}
                    {leaderboard[1] && (
                      <div className="flex flex-col items-center flex-1">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold cc-inset text-[#8A95A8]">
                            {(leaderboard[1].name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute -top-2.5 -right-1 text-[10px]">🥈</span>
                        </div>
                        <span className="text-[10px] font-semibold truncate max-w-[55px] text-text-secondary mt-1">{leaderboard[1].name}</span>
                        <span className="cc-mono text-[9px] font-bold text-text-muted">{leaderboard[1].score}</span>
                        <div className="w-full h-7 rounded-t-md mt-1.5 flex items-center justify-center cc-section-label text-[8px] text-[#8A95A8]" style={{ background: 'rgba(138,149,168,0.06)', border: '1px solid rgba(138,149,168,0.12)' }}>#2</div>
                      </div>
                    )}
                    {/* Rank 1 */}
                    {leaderboard[0] && (
                      <div className="flex flex-col items-center flex-1 -translate-y-1.5">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-[#C4902A] text-[#C4902A]" style={{ background: 'rgba(196,144,42,0.08)', boxShadow: '0 0 12px rgba(196,144,42,0.2)' }}>
                            {(leaderboard[0].name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[12px]">👑</span>
                        </div>
                        <span className="text-[11px] font-bold truncate max-w-[60px] text-gradient-brand mt-1">{leaderboard[0].name}</span>
                        <span className="cc-mono text-[10px] font-bold text-[#C4902A]">{leaderboard[0].score}</span>
                        <div className="w-full h-10 rounded-t-md mt-1.5 flex items-center justify-center cc-section-label text-[9px] font-extrabold text-[#C4902A]" style={{ background: 'rgba(196,144,42,0.08)', border: '1px solid rgba(196,144,42,0.15)' }}>#1</div>
                      </div>
                    )}
                    {/* Rank 3 */}
                    {leaderboard[2] && (
                      <div className="flex flex-col items-center flex-1">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold cc-inset text-[#B87333]">
                            {(leaderboard[2].name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute -top-2.5 -left-1 text-[10px]">🥉</span>
                        </div>
                        <span className="text-[10px] font-semibold truncate max-w-[55px] text-text-secondary mt-1">{leaderboard[2].name}</span>
                        <span className="cc-mono text-[9px] font-bold text-text-muted">{leaderboard[2].score}</span>
                        <div className="w-full h-5 rounded-t-md mt-1.5 flex items-center justify-center cc-section-label text-[8px] text-[#B87333]" style={{ background: 'rgba(184,115,51,0.06)', border: '1px solid rgba(184,115,51,0.12)' }}>#3</div>
                      </div>
                    )}
                  </div>
                )}

                {/* List remaining */}
                {leaderboard.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {leaderboard.slice(3, 5).map((entry) => (
                      <div key={entry.user_id} className="flex items-center gap-2 py-1.5" style={{ borderTop: '1px solid var(--cc-panel-border)' }}>
                        <span className="cc-section-label text-[9px] w-4 shrink-0 text-center">#{entry.rank}</span>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 cc-inset text-text-secondary">
                          {(entry.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium flex-1 text-[11px] truncate text-text-secondary" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {entry.name}
                        </span>
                        <span className="cc-mono text-[11px] font-bold text-[#C4902A] shrink-0">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
