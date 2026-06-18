import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Loader2, Trophy, Flame, ArrowRight,
  PenLine, BookOpen, Users, Dumbbell, Heart, Sparkles,
  Target,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Reveal } from '../../components/ui';

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

/* UPSC CSE Prelims 2026 — update this each cycle */
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

  return (
    <div className="flex flex-col gap-5">

      {/* ══════════════════════════════════════════
          EXAM COUNTDOWN — the hero number
      ══════════════════════════════════════════ */}
      <Reveal>
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(196,144,42,0.18)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Subtle saffron glow at top */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(196,144,42,0.4), transparent)' }}
          />

          <div className="px-8 sm:px-10 py-7 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">

            {/* Left: countdown numbers */}
            <div className="flex flex-col gap-1">
              <div
                className="mb-1"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#C4902A',
                  opacity: 0.85,
                }}
              >
                <Target size={10} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                {EXAM_LABEL}
              </div>

              <div className="flex items-end gap-3 sm:gap-5">
                {[
                  { value: countdown.days,    label: 'Days'    },
                  { value: countdown.hours,   label: 'Hours'   },
                  { value: countdown.minutes, label: 'Min'     },
                  { value: countdown.seconds, label: 'Sec'     },
                ].map(({ value, label }, i) => (
                  <div key={label} className="flex flex-col items-center">
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: i === 0 ? 'clamp(56px, 8vw, 96px)' : 'clamp(36px, 5vw, 60px)',
                        fontWeight: 700,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        background: i === 0
                          ? 'linear-gradient(135deg, #E8ECF4 0%, #C4902A 70%, #E8BC5A 100%)'
                          : 'linear-gradient(135deg, #E8ECF4 0%, #8A95A8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: i === 0 ? 'drop-shadow(0 0 24px rgba(196,144,42,0.2))' : 'none',
                      }}
                    >
                      {String(value).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                      }}
                    >
                      {label}
                    </span>
                    {i < 3 && (
                      <span
                        className="absolute"
                        style={{ display: 'none' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <p
                className="mt-2"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {greeting}, {displayName}. Every day counts.
              </p>
            </div>

            {/* Right: CTA actions */}
            <div className="flex flex-col gap-2.5 shrink-0 min-w-[160px]">
              <button
                onClick={() => navigate('/roadmap')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(196,144,42,0.3)',
                  border: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t('dashboard.todaysPlanBtn')} <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate('/affairs')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-[13px] cursor-pointer transition-all duration-150"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'rgba(196,144,42,0.06)',
                  border: '1px solid rgba(196,144,42,0.15)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t('dashboard.todaysCABtn')}
              </button>
              {todayQuestion && (
                <button
                  onClick={() => navigate('/answers')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-[13px] cursor-pointer transition-all duration-150"
                  style={{
                    color: '#3B6CC4',
                    background: 'rgba(59,108,196,0.08)',
                    border: '1px solid rgba(59,108,196,0.2)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <PenLine size={13} /> Write today's answer
                </button>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════
          STATS ROW — 4 distinct colours
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* Reputation — saffron gold */}
        <Reveal delay={0}>
          <StatPill
            label="Reputation"
            value={loadingStats ? '—' : reputation}
            sub="Total points earned"
            pct={Math.min(100, (reputation / 1000) * 100)}
            accentColor="#C4902A"
            accentAlpha="rgba(196,144,42,"
            gradientFrom="#E8BC5A"
            gradientTo="#C4902A"
          />
        </Reveal>

        {/* Answers — ink blue */}
        <Reveal delay={0.05}>
          <StatPill
            label={t('dashboard.answersWritten')}
            value={loadingStats ? '—' : answersGiven}
            sub="Answers posted"
            pct={Math.min(100, (answersGiven / 50) * 100)}
            accentColor="#3B6CC4"
            accentAlpha="rgba(59,108,196,"
            gradientFrom="#7BAEF0"
            gradientTo="#3B6CC4"
          />
        </Reveal>

        {/* Study Hours — forest green */}
        <Reveal delay={0.1}>
          <StatPill
            label="Study Hours"
            value={loadingStats ? '—' : studyHours}
            sub="Silent library total"
            pct={Math.min(100, (studyHours / 100) * 100)}
            accentColor="#2D8A5E"
            accentAlpha="rgba(45,138,94,"
            gradientFrom="#6ECBA0"
            gradientTo="#2D8A5E"
          />
        </Reveal>

        {/* Streak — deep purple */}
        <Reveal delay={0.15}>
          <StatPill
            label="Streak"
            value={loadingStats ? '—' : `${streak}d`}
            sub="Consecutive days"
            pct={Math.min(100, (streak / 30) * 100)}
            accentColor="#9B4ECA"
            accentAlpha="rgba(155,78,202,"
            gradientFrom="#C991F0"
            gradientTo="#9B4ECA"
            icon={streak >= 7 ? <Flame size={11} style={{ color: '#9B4ECA', filter: 'drop-shadow(0 0 4px rgba(155,78,202,0.8))' }} /> : null}
          />
        </Reveal>
      </div>

      {/* ══════════════════════════════════════════
          MAIN GRID — Plan + Heatmap | Leaderboard + CA
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left column */}
        <div className="flex flex-col gap-5">

          {/* Today's Plan */}
          <Reveal>
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3
                    className="font-semibold flex items-center gap-2 text-text-primary"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px' }}
                  >
                    {t('dashboard.todaysPlan')}
                    {token && <Badge variant="ai" icon={<Sparkles size={9} />}>AI</Badge>}
                  </h3>
                  <span className="text-text-muted text-[12px]">
                    {token ? 'Personalised for your stage & weak areas' : 'Suggested daily tasks'}
                  </span>
                </div>
                {loadingRecs && <Loader2 size={14} className="animate-spin text-text-muted mt-1 shrink-0" />}
              </div>
              <div className="flex flex-col">
                {planItems.map(({ icon, label, sub, route }) => (
                  <button
                    key={route}
                    onClick={() => navigate(route)}
                    className="group flex gap-3 items-start py-2.5 px-3 rounded-lg text-left w-full cursor-pointer bg-transparent border-none transition-all duration-150"
                    style={{ borderBottom: '1px solid var(--border-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,144,42,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span className="mt-0.5 shrink-0" style={{ color: '#C4902A' }}>{icon}</span>
                    <div className="min-w-0">
                      <div
                        className="text-[13.5px] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform duration-150"
                        style={{ color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {label}
                        <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </Reveal>

          {/* Activity Heatmap */}
          <Reveal delay={0.1}>
            <Card className="p-6">
              <div className="w-full flex justify-between items-center mb-4">
                <h3
                  className="font-semibold text-text-primary"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px' }}
                >
                  {t('dashboard.studyActivity')}
                </h3>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{t('dashboard.last8Weeks')}</span>
              </div>
              <div className="flex flex-col gap-1 w-full overflow-x-auto">
                {heatmapData.map((row, rIdx) => (
                  <div className="flex gap-1 items-center" key={rIdx}>
                    <span
                      className="w-6 shrink-0 text-[10px]"
                      style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {rIdx === 0 ? 'Mon' : rIdx === 2 ? 'Wed' : rIdx === 4 ? 'Fri' : rIdx === 6 ? 'Sun' : ''}
                    </span>
                    {row.map((level, cIdx) => (
                      <div
                        key={cIdx}
                        className="w-4 h-4 rounded-[3px] transition-transform hover:scale-125"
                        style={heatStyle[level]}
                        title={`Level ${level}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span>{t('dashboard.less')}</span>
                {[1, 2, 3, 4, 5].map(l => (
                  <div key={l} className="w-3.5 h-3.5 rounded-[3px]" style={heatStyle[l]} />
                ))}
                <span>{t('dashboard.more')}</span>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Leaderboard */}
          <Reveal delay={0.05}>
            <Card className="p-6 flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3
                  className="font-semibold flex items-center gap-2 text-text-primary"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px' }}
                >
                  <Trophy size={15} style={{ color: '#C4902A' }} /> Reputation Leaders
                </h3>
                {loadingLeaderboard && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
              </div>
              {leaderboard.length === 0 && !loadingLeaderboard ? (
                <p className="text-[13px] text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  No leaderboard data yet. Start answering to earn points!
                </p>
              ) : (
                <div className="flex flex-col">
                  {leaderboard.map((entry, i) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center gap-3 py-2.5"
                      style={{ borderTop: i > 0 ? '1px solid var(--border-muted)' : 'none' }}
                    >
                      <span className="text-[11px] w-5 shrink-0 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                        #{entry.rank}
                      </span>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: 'rgba(196,144,42,0.12)', color: '#C4902A', border: '1px solid rgba(196,144,42,0.2)' }}
                      >
                        {(entry.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium flex-1 text-[13px] truncate" style={{ color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{entry.name}</span>
                      <span className="text-[12px] font-bold" style={{ color: '#C4902A' }}>{entry.score} pts</span>
                    </div>
                  ))}
                  {userId && leaderboard.length > 0 && !leaderboard.find(e => e.user_id === userId) && (
                    <div className="flex items-center gap-3 py-2.5" style={{ borderTop: '1px solid var(--border-default)', marginTop: '4px' }}>
                      <span className="text-[11px] w-5 shrink-0 font-medium text-center" style={{ color: 'var(--text-muted)' }}>You</span>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: '#C4902A', color: '#fff' }}
                      >
                        {displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium flex-1 text-[13px]" style={{ color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{displayName}</span>
                      <span className="text-[12px] font-bold" style={{ color: '#C4902A' }}>{reputation} pts</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Reveal>

          {/* Today's CA Digest */}
          <Reveal delay={0.1}>
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3
                  className="font-semibold text-text-primary"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px' }}
                >
                  {t('dashboard.todaysCADigest')}
                </h3>
                <button
                  onClick={() => navigate('/affairs')}
                  className="text-[12px] flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition-colors"
                  style={{ color: '#C4902A', fontFamily: "'DM Sans', sans-serif" }}
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              {caItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <BookOpen size={26} className="opacity-20" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No current affairs published today.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {caItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/affairs/${item.id}`)}
                      className="group border-l-[3px] p-3 px-4 rounded-lg text-left w-full cursor-pointer transition-all duration-150"
                      style={{
                        background: 'rgba(196,144,42,0.04)',
                        border: '1px solid var(--border-default)',
                        borderLeftColor: `var(--c-${GS_ACCENT[item.gs_paper] ?? 'primary'})`,
                        borderLeftWidth: '3px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,144,42,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,144,42,0.04)'; }}
                    >
                      {item.gs_paper && (
                        <Badge variant={GS_ACCENT[item.gs_paper] ?? 'primary'} className="mb-1.5">
                          {item.gs_paper}
                        </Badge>
                      )}
                      <div className="text-[13.5px] font-medium line-clamp-1" style={{ color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
                        {item.title}
                      </div>
                      {item.syllabus_links && (
                        <div className="text-[11px] line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {item.syllabus_links}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

/* ── Stat pill — used inline, no extra import needed ── */
function StatPill({ label, value, sub, pct, accentColor, accentAlpha, gradientFrom, gradientTo, icon }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2"
      style={{
        background: `${accentAlpha}0.08)`,
        border: `1px solid ${accentAlpha}0.18)`,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold"
        style={{ color: accentColor, opacity: 0.9 }}
      >
        {icon}
        {label}
      </div>
      <div
        className="leading-none font-bold"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(36px, 4vw, 52px)',
          letterSpacing: '-0.03em',
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {value}
      </div>
      <div className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>
      <div className="w-full h-[3px] rounded-full mt-1 overflow-hidden" style={{ background: `${accentAlpha}0.12)` }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})` }}
        />
      </div>
    </div>
  );
}

export default Dashboard;
