import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Trophy, Flame, ArrowRight, PenLine, BookOpen, Users, Dumbbell, Heart } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useSelector(state => state.auth);
  const userId = user?.id;

  const {
    data: userStats,
    isLoading: loadingStats,
    execute: fetchStats,
  } = useApi(`${API_BASE}/api/v1/users/:userId/stats`);

  const {
    data: leaderboardData,
    isLoading: loadingLeaderboard,
    execute: fetchLeaderboard,
  } = useApi(`${API_BASE}/api/v1/leaderboard/reputation`);

  const {
    data: todayCA,
    execute: fetchTodayCA,
  } = useApi(`${API_BASE}/api/v1/affairs/today`);

  const {
    data: todayQuestion,
    execute: fetchTodayQuestion,
  } = useApi(`${API_BASE}/api/v1/daily/questions/today`);

  useEffect(() => {
    if (userId) {
      fetchStats({ pathParams: { userId } }).catch(() => {});
    }
    fetchLeaderboard({ queryParams: { limit: 5 } }).catch(() => {});
    fetchTodayCA().catch(() => {});
    fetchTodayQuestion().catch(() => {});
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const caItems = Array.isArray(todayCA) ? todayCA.slice(0, 3) : [];

  const leaderboard = leaderboardData?.leaderboard || [];
  const displayName = user?.name || user?.email?.split('@')[0] || 'Aspirant';
  const reputation = userStats?.reputation ?? user?.reputation ?? 0;
  const streak = userStats?.streak_days ?? user?.streak_days ?? 0;
  const answersGiven = userStats?.answers_given ?? 0;
  const studyMinutes = userStats?.total_study_minutes ?? 0;
  const studyHours = Math.round(studyMinutes / 60);

  // Heatmap built from real Silent Library sessions
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
        // Map date string → total study minutes that day
        const dateMap = {};
        for (const s of sessions) {
          if (!s.start_time || !s.duration_minutes) continue;
          const dateStr = s.start_time.substring(0, 10);
          dateMap[dateStr] = (dateMap[dateStr] || 0) + s.duration_minutes;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDow = (today.getDay() + 6) % 7; // 0=Mon … 6=Sun
        const mondayThisWeek = new Date(today);
        mondayThisWeek.setDate(today.getDate() - currentDow);

        const grid = Array.from({ length: 7 }, () => Array(8).fill(1));
        for (let c = 0; c < 8; c++) {
          const weekMonday = new Date(mondayThisWeek);
          weekMonday.setDate(mondayThisWeek.getDate() - (7 - c) * 7);
          for (let r = 0; r < 7; r++) {
            const date = new Date(weekMonday);
            date.setDate(weekMonday.getDate() + r);
            if (date > today) continue; // future cell stays at level 1
            const mins = dateMap[date.toISOString().substring(0, 10)] || 0;
            grid[r][c] = mins === 0 ? 1 : mins <= 30 ? 2 : mins <= 60 ? 3 : mins <= 120 ? 4 : 5;
          }
        }
        setHeatmapData(grid);
      })
      .catch(() => {});
  }, [userId, token]);

  const bgMap = { 1: 'bg-[#fbefe9]', 2: 'bg-[#efa98d]', 3: 'bg-primary', 4: 'bg-[#a84728]', 5: 'bg-[#6d2c16]' };

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting Card */}
      <div className="bg-gradient-to-br from-bg-surface-dark to-bg-surface rounded-2xl py-8 px-12 flex justify-between items-center text-text-primary">
        <div>
          <div className="text-[11px] tracking-[2px] mb-2 text-text-secondary">
            {new Date().getHours() < 12 ? 'GOOD MORNING' : new Date().getHours() < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING'}
          </div>
          <h1 className="text-[32px] font-serif mb-2">{displayName}, let's get to work.</h1>
          <p className="text-text-secondary text-[14px] mb-6">{t('dashboard.greetingSub')}</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/roadmap')}
              className="bg-primary hover:bg-primary-hover text-text-primary flex items-center justify-center py-2 px-4 rounded-md text-[13px] font-medium transition-colors border-none cursor-pointer">
              {t('dashboard.todaysPlanBtn')}
            </button>
            <button
              onClick={() => navigate('/affairs')}
              className="bg-transparent border border-border-strong text-text-primary py-2 px-4 rounded-md text-[13px] cursor-pointer hover:bg-white/5 transition-colors">
              {t('dashboard.todaysCABtn')}
            </button>
          </div>
        </div>
        <div className="text-right border-l border-border-default pl-8 flex flex-col items-end gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-primary font-medium text-[14px]">
              <Flame size={16} fill="currentColor" /> {streak}-day streak
            </div>
          )}
          <div>
            <h2 className="text-[48px] text-[#EFE4D6] leading-none font-serif">{reputation}</h2>
            <p className="font-sans text-[10px] tracking-[1px] text-text-secondary mt-1">REPUTATION POINTS</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-bg-panel border border-border-default p-5 rounded-xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] text-text-muted uppercase tracking-[1px] mb-2">Reputation</div>
          <div className="text-[32px] font-serif text-text-primary">
            {loadingStats ? <Loader2 size={20} className="animate-spin text-text-muted" /> : reputation}
          </div>
          <div className="text-[12px] text-text-muted mb-4">Total points earned</div>
          <div className="h-1 bg-border-default rounded-full w-full mt-auto">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((reputation / 1000) * 100, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-bg-panel border border-border-default p-5 rounded-xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] text-text-muted uppercase tracking-[1px] mb-2">{t('dashboard.answersWritten')}</div>
          <div className="text-[32px] font-serif text-text-primary">
            {loadingStats ? <Loader2 size={20} className="animate-spin text-text-muted" /> : answersGiven}
          </div>
          <div className="text-[12px] text-text-muted mb-4">Community answers posted</div>
          <div className="h-1 bg-border-default rounded-full w-full mt-auto">
            <div className="h-full rounded-full bg-[#2B7A4B]" style={{ width: `${Math.min((answersGiven / 50) * 100, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-bg-panel border border-border-default p-5 rounded-xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] text-text-muted uppercase tracking-[1px] mb-2">Study Hours</div>
          <div className="text-[32px] font-serif text-text-primary">
            {loadingStats ? <Loader2 size={20} className="animate-spin text-text-muted" /> : studyHours}
          </div>
          <div className="text-[12px] text-text-muted mb-4">Total silent library time</div>
          <div className="h-1 bg-border-default rounded-full w-full mt-auto">
            <div className="h-full rounded-full bg-[#BFA532]" style={{ width: `${Math.min((studyHours / 100) * 100, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-bg-panel border border-border-default p-5 rounded-xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] text-text-muted uppercase tracking-[1px] mb-2">Study Streak</div>
          <div className="text-[32px] font-serif text-text-primary">
            {loadingStats ? <Loader2 size={20} className="animate-spin text-text-muted" /> : `${streak}d`}
          </div>
          <div className="text-[12px] text-text-muted mb-4">Consecutive study days</div>
          <div className="h-1 bg-border-default rounded-full w-full mt-auto">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          {/* Today's Plan */}
          <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-serif text-[18px] font-semibold">{t('dashboard.todaysPlan')}</h3>
                <span className="text-text-muted text-[13px]">Suggested daily tasks</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: <PenLine size={16} />, label: 'Daily Answer Writing', sub: "Today's prompt · 30 min", route: '/answers' },
                { icon: <Dumbbell size={16} />, label: 'Practice Prelims MCQs', sub: 'Prelims Lab · 30-question set · 45 min', route: '/prelims' },
                { icon: <Users size={16} />, label: 'Browse Community Q&A', sub: 'Community tab · Answer a doubt', route: '/community' },
                { icon: <Heart size={16} />, label: 'Silent Study Session', sub: 'Wellbeing · Focus with peers', route: '/wellbeing' },
              ].map(({ icon, label, sub, route }) => (
                <button
                  key={route}
                  onClick={() => navigate(route)}
                  className="flex gap-3 items-start p-3 rounded-lg hover:bg-bg-panel-hover transition text-left w-full cursor-pointer bg-transparent border-none"
                >
                  <span className="mt-0.5 text-primary shrink-0">{icon}</span>
                  <div>
                    <div className="text-[14px] font-medium text-text-primary flex items-center gap-1">
                      {label} <ArrowRight size={12} className="text-text-muted" />
                    </div>
                    <div className="text-[12px] text-text-muted">{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="font-serif text-[18px] font-semibold">{t('dashboard.studyActivity')}</h3>
              <span className="text-text-muted text-[13px]">{t('dashboard.last8Weeks')}</span>
            </div>
            <div className="flex flex-col gap-1 w-full max-w-[max-content]">
              {heatmapData.map((row, rIdx) => (
                <div className="flex gap-1 items-center" key={rIdx}>
                  <span className="text-[10px] text-text-muted w-6">
                    {rIdx % 2 === 0 ? ['Mon', 'Wed', 'Fri', 'Sun'][rIdx / 2] : ''}
                  </span>
                  {row.map((level, cIdx) => (
                    <div key={cIdx} className={`w-4 h-4 rounded-[3px] ${bgMap[level]}`}></div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-[12px] text-text-muted">
              {t('dashboard.less')}
              {[1, 2, 3, 4, 5].map(l => <div key={l} className={`w-4 h-4 rounded-[3px] ${bgMap[l]}`}></div>)}
              {t('dashboard.more')}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Leaderboard */}
          <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-[18px] font-semibold flex items-center gap-2">
                <Trophy size={18} className="text-primary" /> Reputation Leaders
              </h3>
              {loadingLeaderboard && <Loader2 size={14} className="animate-spin text-text-muted" />}
            </div>
            {leaderboard.length === 0 && !loadingLeaderboard && (
              <p className="text-[13px] text-text-muted text-center py-4">No leaderboard data yet. Start answering to earn points!</p>
            )}
            <div className="flex flex-col gap-3">
              {leaderboard.map((entry, i) => (
                <div key={entry.user_id} className={`flex items-center gap-3 ${i > 0 ? 'border-t border-border-default pt-3' : ''}`}>
                  <span className="text-text-muted text-xs w-6 shrink-0 font-medium text-center">#{entry.rank}</span>
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {(entry.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium flex-1 text-[13px] text-text-primary truncate">{entry.name}</span>
                  <span className="text-xs text-primary font-bold">{entry.score} pts</span>
                </div>
              ))}
              {/* Show current user if not in top 5 */}
              {userId && leaderboard.length > 0 && !leaderboard.find(e => e.user_id === userId) && (
                <div className="flex items-center gap-3 border-t border-border-default pt-3">
                  <span className="text-text-muted text-xs w-6 shrink-0 font-medium text-center">You</span>
                  <div className="w-8 h-8 rounded-full bg-primary text-text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {(displayName).substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium flex-1 text-[13px] text-text-primary">{displayName}</span>
                  <span className="text-xs text-primary font-bold">{reputation} pts</span>
                </div>
              )}
            </div>
          </div>

          {/* Today's CA Digest — live */}
          <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-[18px] font-semibold">{t('dashboard.todaysCADigest')}</h3>
              <button
                onClick={() => navigate('/affairs')}
                className="text-[12px] text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            {caItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <BookOpen size={28} className="text-text-muted opacity-40" />
                <p className="text-[13px] text-text-muted">No current affairs published today.</p>
                <p className="text-[11px] text-text-muted opacity-70">Publish items in Admin → Current Affairs.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {caItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/affairs/${item.id}`)}
                    className="border border-border-default border-l-[4px] border-l-primary p-3 px-4 rounded-md bg-bg-panel-hover text-left w-full cursor-pointer hover:bg-bg-surface transition"
                  >
                    {item.gs_paper && (
                      <div className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wider">
                        {item.gs_paper}
                      </div>
                    )}
                    <div className="text-[14px] font-semibold text-text-primary mb-1 line-clamp-1">{item.title}</div>
                    {item.syllabus_links && (
                      <div className="text-[12px] text-text-muted line-clamp-1">Links: {item.syllabus_links}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Today's daily question teaser */}
          {todayQuestion && (
            <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-serif text-[18px] font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" /> Today's Writing Prompt
                </h3>
                <button
                  onClick={() => navigate('/answers')}
                  className="text-[12px] text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                >
                  Write <ArrowRight size={12} />
                </button>
              </div>
              <p className="text-[14px] text-text-primary font-medium leading-snug line-clamp-2">
                {todayQuestion.title}
              </p>
              {todayQuestion.subject && (
                <span className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {todayQuestion.subject}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
