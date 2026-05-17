import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2, Trophy, Flame } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
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

  useEffect(() => {
    if (userId) {
      fetchStats({ pathParams: { userId } }).catch(() => {});
    }
    fetchLeaderboard({ queryParams: { limit: 5 } }).catch(() => {});
  }, [userId]);

  const leaderboard = leaderboardData?.leaderboard || [];
  const displayName = user?.name || user?.email?.split('@')[0] || 'Aspirant';
  const reputation = userStats?.reputation ?? user?.reputation ?? 0;
  const streak = userStats?.streak_days ?? user?.streak_days ?? 0;
  const answersGiven = userStats?.answers_given ?? 0;
  const studyMinutes = userStats?.total_study_minutes ?? 0;
  const studyHours = Math.round(studyMinutes / 60);

  // Heatmap: deterministic based on userId seed — not random per render
  const heatmapData = useMemo(() => {
    const seed = userId || 1;
    return Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => ((seed * (r + 1) * (c + 3)) % 5) + 1)
    );
  }, [userId]);

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
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <CheckCircle2 color="#2B7A4B" size={20} className="shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-text-primary mb-1">Browse community Q&A</div>
                  <div className="text-[12px] text-text-muted">Community tab · Answer a doubt</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Circle color="#A3A19E" size={20} className="shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-text-primary mb-1">Practice Prelims MCQs</div>
                  <div className="text-[12px] text-text-muted">Prelims Lab · 30-question set · <span className="bg-border-default py-[2px] px-[6px] rounded text-[10px]">45 min</span></div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Circle color="#A3A19E" size={20} className="shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-text-primary mb-1">Daily Answer Writing</div>
                  <div className="text-[12px] text-text-muted">Answer Writing tab · Today's prompt · <span className="bg-border-default py-[2px] px-[6px] rounded text-[10px]">30 min</span></div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Circle color="#A3A19E" size={20} className="shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-text-primary mb-1">Review a Past Year Problem</div>
                  <div className="text-[12px] text-text-muted">PYQ Vault · Filter by subject</div>
                </div>
              </div>
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

          {/* CA Digest — static for MVP */}
          <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-[18px] font-semibold">{t('dashboard.todaysCADigest')}</h3>
              <span className="text-text-muted text-[13px]">Syllabus-linked</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="border border-border-default border-l-[4px] border-l-primary p-3 px-4 rounded-md bg-bg-panel-hover">
                <div className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wider">GS2 - IR</div>
                <div className="text-[14px] font-semibold text-text-primary mb-1">India-Maldives diplomatic reset</div>
                <div className="text-[12px] text-text-muted">Connects: Neighbourhood First · SAARC</div>
              </div>
              <div className="border border-border-default border-l-[4px] border-l-[#2B7A4B] p-3 px-4 rounded-md bg-bg-panel-hover">
                <div className="text-[10px] font-semibold text-[#2B7A4B] mb-1 uppercase tracking-wider">GS3 - ECONOMY</div>
                <div className="text-[14px] font-semibold text-text-primary mb-1">RBI holds repo rate at 6.5%</div>
                <div className="text-[12px] text-text-muted">Connects: Monetary Policy · Inflation targeting</div>
              </div>
              <div className="border border-border-default border-l-[4px] border-l-[#BFA532] p-3 px-4 rounded-md bg-bg-panel-hover">
                <div className="text-[10px] font-semibold text-[#BFA532] mb-1 uppercase tracking-wider">GS3 - ENVIRONMENT</div>
                <div className="text-[14px] font-semibold text-text-primary mb-1">COP29 outcome — India's stance</div>
                <div className="text-[12px] text-text-muted">Connects: Climate Finance · UNFCCC</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
