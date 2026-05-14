import React, { useEffect, useState } from 'react';
import { Trophy, Check, X, Loader2, Crown } from 'lucide-react';
import { useSelector } from 'react-redux';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const MOCK_BADGES = [
  { name: "First Blood", desc: "Complete your first PYQ drill.", rarity: "Common", earned: true },
  { name: "Night Owl", desc: "Study in the Silent Library.", rarity: "Rare", earned: true },
  { name: "Streak 30", desc: "Maintain a 30-day streak.", rarity: "Epic", earned: false, progress: 0, total: 30 },
  { name: "Flawless", desc: "Score 100% in a 50-question mock.", rarity: "Legendary", earned: false, progress: 0, total: 1 },
  { name: "Scholar", desc: "Reach 500 reputation points.", rarity: "Epic", earned: false, progress: 0, total: 500 },
  { name: "Cabinet", desc: "Reach Mentor rank.", rarity: "Mythic", earned: false, progress: 0, total: 1000 },
];

const PageHeader = ({ kicker, title, dek, right }) => (
  <div className="mb-8">
    <div className="flex justify-between items-start mb-2">
      <div className="text-[12px] tracking-[3px] text-primary uppercase font-bold mb-4">{kicker}</div>
      {right}
    </div>
    <h1 className="text-4xl font-serif text-text-primary mb-4 leading-tight">{title}</h1>
    <p className="text-lg text-text-secondary max-w-2xl">{dek}</p>
  </div>
);

// Map reputation points → level (mirrors server reputation_service.py)
const LEVELS = [
  { name: "Beginner", min: 0, rank: "Aspirant", lvlNum: 1 },
  { name: "Learner", min: 50, rank: "Cadet", lvlNum: 6 },
  { name: "Contributor", min: 200, rank: "Strategist", lvlNum: 16 },
  { name: "Scholar", min: 500, rank: "Officer", lvlNum: 26 },
  { name: "Mentor", min: 1000, rank: "Senior Officer", lvlNum: 41 },
];

function getLevel(reputation) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (reputation >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  const toNext = next ? next.min - reputation : 0;
  const fromCurrent = next ? next.min - current.min : 1;
  const progress = next ? Math.round(((reputation - current.min) / fromCurrent) * 100) : 100;
  return { current, next, toNext, progress };
}

const Rewards = () => {
  const { user } = useSelector(state => state.auth);
  const reputation = user?.reputation ?? 0;
  const { current: currentLevel, next: nextLevel, toNext, progress: xpProgress } = getLevel(reputation);
  const safeUser = user || {};
  const [leaderboard, setLeaderboard] = useState([]);
  const [studyBoard, setStudyBoard] = useState([]);
  const [userRankings, setUserRankings] = useState(null);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/v1/leaderboard/reputation?limit=10`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/v1/leaderboard/study/alltime?limit=10`).then(r => r.ok ? r.json() : null),
    ]).then(([rep, study]) => {
      if (rep) setLeaderboard(rep.leaderboard || []);
      if (study) setStudyBoard(study.leaderboard || []);
      setLoadingBoard(false);
    }).catch(() => setLoadingBoard(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/api/v1/leaderboard/user/${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUserRankings(d.rankings))
      .catch(() => {});
  }, [user?.id]);

  // Compute earned badges dynamically based on real user data
  const dynamicBadges = MOCK_BADGES.map(b => {
    if (b.name === 'Scholar') return { ...b, progress: reputation, earned: reputation >= 500 };
    if (b.name === 'Cabinet') return { ...b, progress: reputation, earned: reputation >= 1000 };
    if (b.name === 'Streak 30') return { ...b, progress: safeUser.streak_days ?? 0 };
    return b;
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        kicker="THE LADDER · 81 LEVELS · 8 RANKS"
        title={<>From Aspirant to <em className="text-primary not-italic font-serif font-medium">Cabinet Secretary</em>.</>}
        dek="Earn cosmetics, badges, and titles for the work you'd do anyway. Streaks matter. Mistake-logs matter more. No pay-to-win — none of this is sold."
        right={<div className="bg-primary/10 border border-primary text-primary px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-2 shadow-sm"><Trophy size={14}/> {currentLevel.rank} · {reputation} pts</div>}
      />

      {/* Grid container */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        
        {/* Main Column */}
        <div className="flex flex-col gap-6">
          
          {/* Profile Card */}
          <div className="bg-bg-panel border border-border-default rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="bg-bg-surface-dark text-text-primary p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(600px_200px_at_30%_50%,_var(--color-primary),_transparent_70%)]" />
              
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-[#BFA532] border-[3px] border-bg-surface-dark flex items-center justify-center text-white text-4xl font-serif shrink-0 shadow-lg">
                {(safeUser.name || 'U').substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 relative text-center md:text-left">
                <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-1">
                  {currentLevel.rank} · {reputation} XP · {safeUser.role?.toUpperCase() || 'USER'}
                </div>
                <h2 className="text-3xl font-serif font-medium mb-3 tracking-tight">{safeUser.name || 'Aspirant'}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 font-mono text-[11px] text-text-secondary tracking-widest">
                  <span>LEVEL · {currentLevel.name.toUpperCase()}</span>
                  <span>EXAM STAGE · {(safeUser.exam_stage || 'beginner').toUpperCase()}</span>
                </div>
              </div>

              <div className="relative text-center md:text-right mt-4 md:mt-0">
                <div className="font-mono text-[10px] text-text-muted tracking-[0.15em] mb-1">NEXT RANK</div>
                {nextLevel ? (
                  <>
                    <div className="font-serif text-2xl text-primary font-medium mb-1">{nextLevel.rank}</div>
                    <div className="text-[11px] text-text-secondary">{toNext} pts to go</div>
                  </>
                ) : (
                  <div className="font-serif text-2xl text-primary font-medium mb-1">Max Level</div>
                )}
              </div>
            </div>

            {/* XP progress bar to next level */}
            <div className="p-6 md:px-8 md:py-6 bg-bg-panel-hover">
              <div className="flex justify-between font-mono text-[11px] text-text-muted mb-2">
                <span>{currentLevel.name.toUpperCase()} · {reputation} XP</span>
                {nextLevel && <span>{toNext} XP to {nextLevel.name}</span>}
              </div>
              <div className="h-2 bg-border-default rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[#BFA532] rounded-full"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Rank Ladder */}
          <div className="bg-bg-panel border border-border-default rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-border-default">
              <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-1">THE LADDER</div>
              <h3 className="font-serif text-[22px] font-medium text-text-primary">Five ranks. The hierarchy is the journey.</h3>
            </div>
            <div className="p-6 overflow-x-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-primary [scrollbar-width:thin] [scrollbar-color:#D4613C_transparent]">
              <RankLadder currentRank={currentLevel.rank} />
            </div>
          </div>

          {/* Badges grid */}
          <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
              <div>
                <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-1">TROPHY ROOM</div>
                <h3 className="font-serif text-[22px] font-medium text-text-primary">
                  {dynamicBadges.filter(b => b.earned).length} of {dynamicBadges.length} badges earned
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dynamicBadges.map(b => <BadgeCard key={b.name} b={b}/>)}
            </div>
          </div>

          {/* Live Leaderboard */}
          <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-2">LIVE LEADERBOARD</div>
            <h3 className="font-serif text-[22px] font-medium text-text-primary mb-5">Reputation Rankings</h3>
            {loadingBoard ? (
              <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                <Loader2 size={14} className="animate-spin" /> Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-text-muted text-sm">No leaderboard data yet. Start earning XP!</p>
            ) : (
              <div className="flex flex-col gap-2">
                {leaderboard.map((entry, i) => {
                  const isMe = user?.id && entry.user_id === user.id;
                  return (
                    <div key={entry.user_id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isMe ? 'bg-primary/8 border border-primary/20' : 'bg-bg-panel-hover'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                        i === 0 ? 'bg-[#BFA532] text-white' : i === 1 ? 'bg-[#a0a0a0] text-white' : i === 2 ? 'bg-[#cd7f32] text-white' : 'bg-bg-surface text-text-muted'
                      }`}>
                        {i < 3 ? <Crown size={12} /> : entry.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-text-primary truncate flex items-center gap-2">
                          {entry.name}
                          {isMe && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-semibold">YOU</span>}
                        </div>
                        <div className="text-[11px] text-text-muted capitalize">{entry.exam_stage}</div>
                      </div>
                      <span className="text-sm font-bold text-primary shrink-0">{entry.score} pts</span>
                    </div>
                  );
                })}
              </div>
            )}

            {userRankings && (
              <div className="mt-4 pt-4 border-t border-border-default">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Your rankings</div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="bg-bg-panel-hover px-3 py-2 rounded-lg">
                    <div className="text-text-muted">Reputation rank</div>
                    <div className="font-semibold text-text-primary">
                      #{userRankings.reputation?.rank ?? '—'}
                    </div>
                  </div>
                  <div className="bg-bg-panel-hover px-3 py-2 rounded-lg">
                    <div className="text-text-muted">Study time rank</div>
                    <div className="font-semibold text-text-primary">
                      #{userRankings.study_alltime?.rank ?? '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-2">YOUR STATS</div>
            <div className="flex flex-col gap-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-text-secondary">Total XP</span>
                <span className="font-mono font-semibold text-text-primary">{reputation.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-text-secondary">Current Rank</span>
                <span className="font-semibold text-primary text-[12px]">{currentLevel.rank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-text-secondary">Streak</span>
                <span className="font-mono font-semibold text-text-primary">{safeUser.streak_days ?? 0} days</span>
              </div>
              {userRankings?.reputation?.rank && (
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-text-secondary">Global rank</span>
                  <span className="font-mono font-semibold text-text-primary">#{userRankings.reputation.rank}</span>
                </div>
              )}
            </div>
          </div>

          {/* Study time leaderboard */}
          <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-4">TOP STUDIERS · ALL TIME</div>
            {studyBoard.length === 0 && !loadingBoard ? (
              <p className="text-[12px] text-text-muted">No study time data yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {studyBoard.slice(0, 5).map((e, i) => {
                  const isMe = user?.id && e.user_id === user.id;
                  return (
                    <li key={e.user_id} className={`flex items-center gap-2 text-[12px] ${isMe ? 'text-primary font-semibold' : ''}`}>
                      <span className="w-5 font-mono text-text-muted shrink-0">#{e.rank}</span>
                      <span className="flex-1 text-text-primary truncate">{e.name}{isMe ? ' (you)' : ''}</span>
                      <span className="font-mono text-text-secondary shrink-0">{e.study_hours}h</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-2">COSMETICS · UNLOCKED</div>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">Ranks unlock dashboard themes and avatar frames. None of this is sold.</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { t: "Inkwell", on: true },
                { t: "Saffron", on: true, current: true },
                { t: "Mission", on: true },
                { t: "Cloister", lock: true },
                { t: "Cabinet", lock: "Lvl 60" },
                { t: "Service", lock: "Lvl 81" },
              ].map((c, i) => (
                <div key={i} className={`aspect-[1/1] rounded-xl p-2 flex flex-col justify-end text-[9px] font-mono tracking-widest relative overflow-hidden ${
                  c.lock ? "bg-bg-panel-hover text-text-muted border border-border-default" :
                  i === 1 ? "bg-gradient-to-br from-primary to-[#BFA532] text-white border-[2px] border-primary" :
                  i === 0 ? "bg-bg-surface-dark text-text-primary border border-border-muted" :
                  "bg-gradient-to-br from-indigo-500 to-indigo-900 text-white border border-border-default"
                }`}>
                  {c.lock && typeof c.lock === "string" && <div className="mb-1">🔒 {c.lock}</div>}
                  <div className="font-semibold uppercase truncate relative z-10">{c.t}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

const RankLadder = ({ currentRank }) => {
  const ranks = [
    { name: "Aspirant", pts: "0+" },
    { name: "Cadet", pts: "50+" },
    { name: "Strategist", pts: "200+" },
    { name: "Officer", pts: "500+" },
    { name: "Mentor", pts: "1000+" },
  ];
  const currentIdx = ranks.findIndex(r => r.name === currentRank);

  return (
    <div className="flex items-stretch min-w-[500px] py-4">
      {ranks.map((r, i) => {
        const passed = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={i} className="flex-1 relative">
            {i < ranks.length - 1 && (
              <div className={`absolute left-[60%] right-[-40%] top-[18px] h-px ${passed ? 'border-t border-primary' : 'border-t border-dashed border-border-default'}`} />
            )}
            <div className={`relative w-9 h-9 rounded-full flex items-center justify-center font-mono text-[11px] font-bold mx-auto border-2 ${
              passed ? "bg-primary border-primary text-white shadow-[0_0_12px_rgba(212,97,60,0.4)]" :
              active ? "bg-bg-surface-dark border-bg-surface-dark text-text-primary shadow-md ring-2 ring-primary ring-offset-1" :
              "bg-bg-panel border-border-default text-text-muted"
            }`}>
              {passed ? <Check size={14} strokeWidth={2.5} /> : i + 1}
            </div>
            <div className="text-center mt-3">
              <div className={`font-serif text-sm font-medium ${active ? 'text-primary' : passed ? 'text-text-primary' : 'text-text-muted'}`}>{r.name}</div>
              <div className="font-mono text-[9.5px] text-text-muted mt-1 tracking-widest">{r.pts}</div>
              {active && <div className="font-mono text-[10px] text-primary mt-1.5 font-semibold">YOU ARE HERE</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BadgeCard = ({ b }) => {
  const earned = b.earned;
  
  // Mapping rare colors to tailwind hexes
  let colorHex;
  switch (b.rarity) {
    case 'Rare': colorHex = '#818cf8'; break; // indigo-400
    case 'Epic': colorHex = '#D4613C'; break; // primary
    case 'Legendary': colorHex = '#BFA532'; break; // gold
    case 'Mythic': colorHex = '#ef4444'; break; // crimson/red
    default: colorHex = 'var(--color-text-muted)'; // common
  }

  const borderStyle = earned ? { borderColor: colorHex } : { borderColor: 'var(--color-border-default)' };
  const iconBgStyle = earned ? { background: `linear-gradient(135deg, ${colorHex}, var(--color-bg-surface-dark))` } : { background: 'var(--color-bg-surface)' };
  const rarityTextStyle = { color: colorHex };
  const progressBarStyle = { width: `${(b.progress/b.total)*100}%`, background: colorHex };

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-2 relative transition-all ${earned ? 'bg-bg-panel shadow-sm hover:-translate-y-1 hover:shadow-md' : 'bg-bg-panel-hover opacity-85'}`} style={borderStyle}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${earned ? 'text-white shadow-sm' : 'text-text-muted'}`} style={iconBgStyle}>
        {earned ? <Trophy size={22} /> : <X size={22} />}
      </div>
      <div className={`font-serif text-[15px] font-semibold mt-1 ${earned ? 'text-text-primary' : 'text-text-secondary'}`}>{b.name}</div>
      <div className="text-[11px] text-text-secondary leading-relaxed flex-1">{b.desc}</div>
      
      <div className="mt-2 pt-2 border-t border-dashed border-border-default flex justify-between items-center">
        <span className="font-mono text-[9px] tracking-widest font-semibold uppercase" style={rarityTextStyle}>{b.rarity}</span>
        {!earned && b.progress && <span className="font-mono text-[10px] text-text-muted">{b.progress}/{b.total}</span>}
        {earned && <Check size={12} strokeWidth={2.5} className="text-text-primary opacity-60"/>}
      </div>
      
      {!earned && b.progress && (
        <div className="h-[3px] bg-border-default rounded-full mt-1">
          <div className="h-full rounded-full transition-all duration-1000" style={progressBarStyle} />
        </div>
      )}
    </div>
  );
};

export default Rewards;
