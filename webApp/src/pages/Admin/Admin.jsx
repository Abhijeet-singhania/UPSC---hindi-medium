import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard, Newspaper, FlaskConical, PenTool, Settings2,
  Users, RefreshCw, CheckCircle2, XCircle, Trash2, Play, Clock,
  AlertTriangle, ChevronDown, ChevronUp, Plus, Shield, Zap,
  Eye, EyeOff, RotateCcw, Activity, Database, Calendar
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// ── helpers ──────────────────────────────────────────────────────────────────

const useAdminFetch = (token) => {
  const call = useCallback(async (path, options = {}) => {
    const res = await fetch(`${API_BASE}/api/v1${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }, [token]);
  return call;
};

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-bg-surface text-text-muted border border-border-default',
    primary: 'bg-[#fbefe9] text-primary',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
};

const StatCard = ({ icon, label, value, sub, color = 'primary' }) => (
  <div className="bg-bg-panel border border-border-default rounded-xl p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
      color === 'primary' ? 'bg-[#fbefe9] text-primary' :
      color === 'amber' ? 'bg-amber-100 text-amber-600' :
      color === 'green' ? 'bg-emerald-100 text-emerald-600' :
      'bg-blue-100 text-blue-600'
    }`}>
      {icon}
    </div>
    <div>
      <div className="text-[26px] font-bold text-text-primary leading-none">{value ?? '—'}</div>
      <div className="text-[13px] text-text-primary font-medium mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-10">
    <RefreshCw size={20} className="animate-spin text-text-muted" />
  </div>
);

const EmptyState = ({ msg }) => (
  <div className="text-center text-text-muted text-[13px] py-10">{msg}</div>
);

const ActionBtn = ({ onClick, variant = 'default', disabled, children }) => {
  const base = 'flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    default: 'border border-border-default text-text-muted hover:bg-bg-panel-hover',
    green: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    red: 'bg-red-100 text-red-700 hover:bg-red-200',
    primary: 'bg-primary text-white hover:bg-primary-hover',
    amber: 'bg-amber-500 text-white hover:bg-amber-600',
  };
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

// ── Tab: Overview ─────────────────────────────────────────────────────────────

const OverviewTab = ({ token, onTabChange }) => {
  const call = useAdminFetch(token);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState({});
  const [triggerMsg, setTriggerMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ca, quiz, dq, users, jobData] = await Promise.allSettled([
        call('/affairs/admin/all?limit=1'),
        call('/quiz-questions/admin/all?limit=1'),
        call('/daily/questions/?limit=100'),
        call('/users/admin/users?limit=1'),
        call('/affairs/admin/job-status'),
      ]);
      setStats({
        caTotal: ca.status === 'fulfilled' ? ca.value?.total : '?',
        caDrafts: null,
        quizTotal: quiz.status === 'fulfilled' ? quiz.value?.total : '?',
        quizPending: null,
        dqTotal: dq.status === 'fulfilled' ? dq.value?.length : '?',
        dqActive: dq.status === 'fulfilled' ? dq.value?.filter(q => q.is_active).length : 0,
        users: users.status === 'fulfilled' ? users.value?.total : '?',
      });
      // Get draft/pending sub-counts
      const [caDrafts, quizPending] = await Promise.allSettled([
        call('/affairs/admin/all?is_published=false&limit=1'),
        call('/quiz-questions/admin/all?is_approved=false&limit=1'),
      ]);
      setStats(s => ({
        ...s,
        caDrafts: caDrafts.status === 'fulfilled' ? caDrafts.value?.total : '?',
        quizPending: quizPending.status === 'fulfilled' ? quizPending.value?.total : '?',
      }));
      if (jobData.status === 'fulfilled') setJobs(jobData.value);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { load(); }, [load]);

  const trigger = async (action, label) => {
    setTriggering(t => ({ ...t, [action]: true }));
    setTriggerMsg('');
    try {
      const res = await call(`/affairs/admin/${action}`, { method: 'POST' });
      setTriggerMsg(`✓ ${res?.message || label + ' triggered.'}`);
      setTimeout(() => setTriggerMsg(''), 6000);
    } catch (e) {
      setTriggerMsg(`✗ ${e.message}`);
    } finally {
      setTriggering(t => ({ ...t, [action]: false }));
    }
  };

  if (loading) return <Spinner />;

  const JOB_LABELS = {
    expire_stale_sessions: 'Expire Stale Sessions',
    reset_daily_leaderboard: 'Reset Daily Leaderboard',
    reset_weekly_leaderboard: 'Reset Weekly Leaderboard',
    rotate_daily_question: 'Rotate Daily Question',
    ingest_current_affairs: 'Ingest Current Affairs',
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Newspaper size={18} />} label="Total Current Affairs" value={stats?.caTotal}
          sub={stats?.caDrafts != null ? `${stats.caDrafts} drafts pending` : undefined}
          color="primary" />
        <StatCard icon={<FlaskConical size={18} />} label="Quiz Questions" value={stats?.quizTotal}
          sub={stats?.quizPending != null ? `${stats.quizPending} pending approval` : undefined}
          color="amber" />
        <StatCard icon={<PenTool size={18} />} label="Daily Questions" value={stats?.dqTotal}
          sub={`${stats?.dqActive ?? 0} active`} color="green" />
        <StatCard icon={<Users size={18} />} label="Total Users" value={stats?.users} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-bg-panel border border-border-default rounded-xl p-5">
          <div className="text-[13px] font-bold uppercase tracking-wider text-text-muted mb-4">Quick Actions</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-bg-surface rounded-xl">
              <div>
                <div className="text-[13px] font-semibold text-text-primary">Run News Ingestion</div>
                <div className="text-[11px] text-text-muted mt-0.5">Fetch RSS feeds + AI summarise → saves as drafts</div>
              </div>
              <ActionBtn variant="primary" onClick={() => trigger('trigger-ingestion', 'Ingestion')}
                disabled={triggering['trigger-ingestion']}>
                {triggering['trigger-ingestion'] ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                Run Now
              </ActionBtn>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg-surface rounded-xl">
              <div>
                <div className="text-[13px] font-semibold text-text-primary">Rotate Daily Question</div>
                <div className="text-[11px] text-text-muted mt-0.5">Activate next queued answer-writing question</div>
              </div>
              <ActionBtn variant="amber" onClick={() => trigger('trigger-rotate-question', 'Rotation')}
                disabled={triggering['trigger-rotate-question']}>
                {triggering['trigger-rotate-question'] ? <RefreshCw size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                Rotate
              </ActionBtn>
            </div>
            {stats?.caDrafts > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-[13px] font-medium text-amber-800">
                  {stats.caDrafts} draft CA(s) waiting for review
                </div>
                <ActionBtn variant="default" onClick={() => onTabChange('affairs')}>
                  Review →
                </ActionBtn>
              </div>
            )}
            {stats?.quizPending > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-[13px] font-medium text-blue-800">
                  {stats.quizPending} quiz question(s) pending approval
                </div>
                <ActionBtn variant="default" onClick={() => onTabChange('quiz')}>
                  Review →
                </ActionBtn>
              </div>
            )}
          </div>
          {triggerMsg && (
            <div className={`mt-3 text-[12px] rounded-lg px-3 py-2 ${
              triggerMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {triggerMsg}
            </div>
          )}
        </div>

        {/* Job Scheduler */}
        <div className="bg-bg-panel border border-border-default rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-bold uppercase tracking-wider text-text-muted">Scheduled Jobs</div>
            {jobs && (
              <Badge color={jobs.scheduler_running ? 'green' : 'red'}>
                <Activity size={10} className="mr-1" />
                {jobs.scheduler_running ? 'Running' : 'Stopped'}
              </Badge>
            )}
          </div>
          {jobs ? (
            <div className="space-y-2">
              {jobs.jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between text-[12px] py-2 border-b border-border-default last:border-0">
                  <span className="text-text-primary font-medium">{JOB_LABELS[job.id] || job.id}</span>
                  <span className="text-text-muted flex items-center gap-1">
                    <Clock size={11} />
                    {job.next_run === 'paused' ? 'Paused' : new Date(job.next_run).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : <EmptyState msg="Could not load job status" />}
        </div>
      </div>
    </div>
  );
};

// ── Tab: Current Affairs ──────────────────────────────────────────────────────

const AffairsTab = ({ token }) => {
  const call = useAdminFetch(token);
  const [filter, setFilter] = useState('drafts'); // 'drafts' | 'published'
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const published = filter === 'published' ? 'true' : 'false';
      const data = await call(`/affairs/admin/all?is_published=${published}&limit=50`);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [call, filter]);

  useEffect(() => { load(); }, [load]);

  const togglePublish = async (item) => {
    setBusy(b => ({ ...b, [item.id]: true }));
    try {
      await call(`/affairs/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      // Refetch the full list so stale rows are cleared and counts update
      await load();
    } finally {
      setBusy(b => ({ ...b, [item.id]: false }));
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this current affair?')) return;
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await call(`/affairs/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
      setTotal(t => t - 1);
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['drafts', 'published'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition ${
                filter === f ? 'bg-primary text-white' : 'border border-border-default text-text-muted hover:bg-bg-panel-hover'
              }`}>
              {f === 'drafts' ? 'Drafts (Pending)' : 'Published'}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-text-muted">{total} items</span>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState msg={`No ${filter} current affairs found.`} />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-bg-panel border border-border-default rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {item.gs_paper && <Badge color="primary">{item.gs_paper}</Badge>}
                    {item.source_name && <Badge color="gray">{item.source_name}</Badge>}
                    {item.language && <Badge color="blue">{item.language.toUpperCase()}</Badge>}
                    <Badge color={item.is_published ? 'green' : 'amber'}>
                      {item.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="text-[14px] font-semibold text-text-primary leading-snug">{item.title}</div>
                  <div className="text-[12px] text-text-muted mt-1 line-clamp-2">{item.summary}</div>
                  {item.subject_tags && (
                    <div className="text-[11px] text-text-muted mt-1">Tags: {item.subject_tags}</div>
                  )}
                  <div className="text-[11px] text-text-muted mt-1">
                    {item.published_date} {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" className="text-primary underline ml-2">Source ↗</a>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ActionBtn variant={item.is_published ? 'default' : 'green'} onClick={() => togglePublish(item)} disabled={busy[item.id]}>
                    {item.is_published ? <><EyeOff size={13} /> Unpublish</> : <><Eye size={13} /> Publish</>}
                  </ActionBtn>
                  <ActionBtn variant="red" onClick={() => deleteItem(item.id)} disabled={busy[item.id]}>
                    <Trash2 size={13} />
                  </ActionBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab: Quiz Bank ────────────────────────────────────────────────────────────

const QuizTab = ({ token }) => {
  const call = useAdminFetch(token);
  const [filter, setFilter] = useState('pending');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const approved = filter === 'approved' ? 'true' : 'false';
      const data = await call(`/quiz-questions/admin/all?is_approved=${approved}&limit=50`);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [call, filter]);

  useEffect(() => { load(); }, [load]);

  const toggleApprove = async (item) => {
    setBusy(b => ({ ...b, [item.id]: true }));
    try {
      await call(`/quiz-questions/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_approved: !item.is_approved }),
      });
      setItems(prev => prev.filter(i => i.id !== item.id));
      setTotal(t => t - 1);
    } finally {
      setBusy(b => ({ ...b, [item.id]: false }));
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this quiz question?')) return;
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await call(`/quiz-questions/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
      setTotal(t => t - 1);
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  };

  const DIFF_COLOR = { easy: 'green', medium: 'amber', hard: 'red' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['pending', 'approved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition ${
                filter === f ? 'bg-primary text-white' : 'border border-border-default text-text-muted hover:bg-bg-panel-hover'
              }`}>
              {f === 'pending' ? 'Pending Approval' : 'Approved'}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-text-muted">{total} questions</span>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState msg={`No ${filter} quiz questions.`} />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-bg-panel border border-border-default rounded-xl overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {item.subject && <Badge color="primary">{item.subject}</Badge>}
                    {item.topic && <Badge color="gray">{item.topic}</Badge>}
                    {item.difficulty && <Badge color={DIFF_COLOR[item.difficulty] || 'gray'}>{item.difficulty}</Badge>}
                    <Badge color={item.is_approved ? 'green' : 'amber'}>
                      {item.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="text-[13px] text-text-primary font-medium leading-snug line-clamp-2">
                    {item.question_text}
                  </div>
                  {item.source && <div className="text-[11px] text-text-muted mt-1">Source: {item.source}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="text-text-muted hover:text-text-primary cursor-pointer">
                    {expanded === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <ActionBtn variant={item.is_approved ? 'red' : 'green'} onClick={() => toggleApprove(item)} disabled={busy[item.id]}>
                    {item.is_approved ? <><XCircle size={13} /> Revoke</> : <><CheckCircle2 size={13} /> Approve</>}
                  </ActionBtn>
                  <ActionBtn variant="red" onClick={() => deleteItem(item.id)} disabled={busy[item.id]}>
                    <Trash2 size={13} />
                  </ActionBtn>
                </div>
              </div>
              {expanded === item.id && (
                <div className="border-t border-border-default p-4 bg-bg-surface text-[12px] space-y-2">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} className={`flex gap-2 ${item.correct_option === opt ? 'text-emerald-700 font-semibold' : 'text-text-muted'}`}>
                      <span className="w-4 shrink-0">{opt}.</span>
                      <span>{item[`option_${opt.toLowerCase()}`]}</span>
                      {item.correct_option === opt && <CheckCircle2 size={12} className="shrink-0 mt-0.5" />}
                    </div>
                  ))}
                  {item.explanation && (
                    <div className="mt-2 pt-2 border-t border-border-default text-text-secondary">
                      <span className="font-semibold">Explanation:</span> {item.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab: Daily Questions ──────────────────────────────────────────────────────

const DailyTab = ({ token }) => {
  const call = useAdminFetch(token);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const todayISO = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ title: '', content: '', subject: '', word_limit: 250, marks: 15, model_answer: '', date: todayISO });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call('/daily/questions/?limit=50');
      setQuestions(Array.isArray(data) ? data : []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (item) => {
    setBusy(b => ({ ...b, [item.id]: true }));
    try {
      await call(`/daily/questions/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      setQuestions(prev => prev.map(q => q.id === item.id ? { ...q, is_active: !q.is_active } : q));
    } finally {
      setBusy(b => ({ ...b, [item.id]: false }));
    }
  };

  const createQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const created = await call('/daily/questions/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setQuestions(prev => [created, ...prev]);
      setShowCreate(false);
      setForm({ title: '', content: '', subject: '', word_limit: 250, marks: 15, model_answer: '', date: todayISO });
      setSaveMsg('Question created!');
    } catch (e) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13px] text-text-muted">{questions.length} questions in queue</div>
        <ActionBtn variant="primary" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={13} /> New Question
        </ActionBtn>
      </div>

      {showCreate && (
        <form onSubmit={createQuestion} className="bg-bg-panel border border-primary/40 rounded-xl p-5 mb-5 space-y-3">
          <div className="text-[14px] font-semibold text-text-primary mb-1">Create Daily Question</div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Question Content *</label>
              <textarea required rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="mt-1 w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Subject</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. GS2" className="mt-1 w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Scheduled Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Word Limit</label>
                <input type="number" value={form.word_limit} onChange={e => setForm(f => ({ ...f, word_limit: +e.target.value }))}
                  className="mt-1 w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Marks</label>
                <input type="number" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: +e.target.value }))}
                  className="mt-1 w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Model Answer (optional)</label>
              <textarea rows={3} value={form.model_answer} onChange={e => setForm(f => ({ ...f, model_answer: e.target.value }))}
                className="mt-1 w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          </div>
          {saveMsg && <div className="text-[12px] text-red-600">{saveMsg}</div>}
          <div className="flex gap-2 pt-1">
            <ActionBtn variant="primary" disabled={saving}>
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />} Create
            </ActionBtn>
            <ActionBtn variant="default" onClick={() => setShowCreate(false)}>Cancel</ActionBtn>
          </div>
        </form>
      )}

      {loading ? <Spinner /> : questions.length === 0 ? (
        <EmptyState msg="No daily questions yet. Create one above." />
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div key={q.id} className="bg-bg-panel border border-border-default rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge color={q.is_active ? 'green' : 'gray'}>{q.is_active ? 'Active' : 'Queued'}</Badge>
                  {q.subject && <Badge color="primary">{q.subject}</Badge>}
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Calendar size={10} /> {q.date ? new Date(q.date).toLocaleDateString('en-IN') : '—'}
                  </span>
                </div>
                <div className="text-[13px] font-semibold text-text-primary">{q.title}</div>
                <div className="text-[12px] text-text-muted mt-0.5 line-clamp-1">{q.content}</div>
                <div className="text-[11px] text-text-muted mt-1">{q.marks} marks · {q.word_limit} words · {q.submission_count ?? 0} submissions</div>
              </div>
              <ActionBtn variant={q.is_active ? 'default' : 'green'} onClick={() => toggleActive(q)} disabled={busy[q.id]}>
                {q.is_active ? <><EyeOff size={13} /> Deactivate</> : <><Play size={13} /> Activate</>}
              </ActionBtn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab: Jobs ─────────────────────────────────────────────────────────────────

const JobsTab = ({ token }) => {
  const call = useAdminFetch(token);
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState({});
  const [msgs, setMsgs] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call('/affairs/admin/job-status');
      setJobs(data);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { load(); }, [load]);

  const trigger = async (action, key) => {
    setTriggering(t => ({ ...t, [key]: true }));
    setMsgs(m => ({ ...m, [key]: '' }));
    try {
      const res = await call(`/affairs/admin/${action}`, { method: 'POST' });
      setMsgs(m => ({ ...m, [key]: `✓ ${res?.message || 'Done'}` }));
      setTimeout(() => setMsgs(m => ({ ...m, [key]: '' })), 8000);
    } catch (e) {
      setMsgs(m => ({ ...m, [key]: `✗ ${e.message}` }));
    } finally {
      setTriggering(t => ({ ...t, [key]: false }));
    }
  };

  const JOB_INFO = {
    expire_stale_sessions: { label: 'Expire Stale Sessions', desc: 'Closes silent-library sessions open > 8 hrs', schedule: 'Every hour' },
    reset_daily_leaderboard: { label: 'Reset Daily Leaderboard', desc: 'Clears daily study-time rankings', schedule: 'Daily at 00:05 IST' },
    reset_weekly_leaderboard: { label: 'Reset Weekly Leaderboard', desc: 'Clears weekly rankings', schedule: 'Monday 00:10 IST' },
    rotate_daily_question: { label: 'Rotate Daily Question', desc: 'Activates next queued answer-writing question', schedule: 'Daily at 06:00 IST' },
    ingest_current_affairs: { label: 'Ingest Current Affairs', desc: 'RSS feeds → Gemini AI summarise → save as drafts', schedule: 'Daily at 07:30 IST' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {jobs && (
            <Badge color={jobs.scheduler_running ? 'green' : 'red'}>
              <Activity size={10} className="mr-1" />
              Scheduler {jobs.scheduler_running ? 'running' : 'stopped'}
            </Badge>
          )}
        </div>
        <ActionBtn variant="default" onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </ActionBtn>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Triggerable jobs */}
        <div className="bg-bg-panel border border-border-default rounded-xl p-5">
          <div className="text-[12px] font-bold uppercase tracking-wider text-text-muted mb-3">Manual Triggers</div>
          <div className="space-y-3">
            {[
              { key: 'ingestion', action: 'trigger-ingestion', label: 'Run News Ingestion', desc: 'Fetch RSS feeds → Gemini AI → save drafts for review', variant: 'primary' },
              { key: 'rotate', action: 'trigger-rotate-question', label: 'Rotate Daily Question', desc: 'Push next queued question live', variant: 'amber' },
            ].map(({ key, action, label, desc, variant }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-bg-surface rounded-xl">
                <div>
                  <div className="text-[13px] font-semibold text-text-primary">{label}</div>
                  <div className="text-[11px] text-text-muted">{desc}</div>
                  {msgs[key] && <div className={`text-[11px] mt-1 ${msgs[key].startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{msgs[key]}</div>}
                </div>
                <ActionBtn variant={variant} onClick={() => trigger(action, key)} disabled={triggering[key]}>
                  {triggering[key] ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                  Run
                </ActionBtn>
              </div>
            ))}
          </div>
        </div>

        {/* All jobs */}
        {loading ? <Spinner /> : jobs ? (
          <div className="bg-bg-panel border border-border-default rounded-xl p-5">
            <div className="text-[12px] font-bold uppercase tracking-wider text-text-muted mb-3">All Scheduled Jobs</div>
            <div className="space-y-3">
              {jobs.jobs.map(job => {
                const info = JOB_INFO[job.id] || { label: job.id, desc: '', schedule: '' };
                return (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-bg-surface rounded-xl">
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">{info.label}</div>
                      <div className="text-[11px] text-text-muted">{info.desc}</div>
                      <div className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                        <Database size={9} /> Schedule: {info.schedule}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-text-muted">Next run</div>
                      <div className="text-[12px] font-semibold text-text-primary flex items-center gap-1">
                        <Clock size={11} />
                        {job.next_run === 'paused' ? 'Paused' : new Date(job.next_run).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : <EmptyState msg="Could not load job status" />}
      </div>
    </div>
  );
};

// ── Tab: Users ────────────────────────────────────────────────────────────────

const UsersTab = ({ token }) => {
  const call = useAdminFetch(token);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call('/users/admin/users?limit=100');
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (userId, role) => {
    setChanging(c => ({ ...c, [userId]: true }));
    try {
      await call(`/users/admin/users/${userId}/role?role=${role}`, { method: 'PUT' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } finally {
      setChanging(c => ({ ...c, [userId]: false }));
    }
  };

  const ROLE_COLORS = { admin: 'red', moderator: 'amber', user: 'gray' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] text-text-muted">{total} total users</span>
        <ActionBtn variant="default" onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </ActionBtn>
      </div>

      {loading ? <Spinner /> : users.length === 0 ? (
        <EmptyState msg="No users found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border-default text-text-muted text-left">
                <th className="pb-2 pr-4 font-semibold">Name / Email</th>
                <th className="pb-2 pr-4 font-semibold">Role</th>
                <th className="pb-2 pr-4 font-semibold text-right">Reputation</th>
                <th className="pb-2 pr-4 font-semibold text-right">Streak</th>
                <th className="pb-2 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border-default last:border-0 hover:bg-bg-panel-hover/50">
                  <td className="py-2.5 pr-4">
                    <div className="font-semibold text-text-primary">{u.name || '(no name)'}</div>
                    <div className="text-text-muted">{u.email}</div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      disabled={changing[u.id]}
                      className="bg-bg-surface border border-border-default rounded-md px-2 py-1 text-[11px] text-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-text-primary">{u.reputation ?? 0}</td>
                  <td className="py-2.5 pr-4 text-right text-text-primary">{u.streak_days ?? 0}d</td>
                  <td className="py-2.5 text-text-muted">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Main Admin Page ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { id: 'affairs', label: 'Current Affairs', icon: <Newspaper size={15} /> },
  { id: 'quiz', label: 'Quiz Bank', icon: <FlaskConical size={15} /> },
  { id: 'daily', label: 'Daily Questions', icon: <PenTool size={15} /> },
  { id: 'jobs', label: 'Jobs & System', icon: <Settings2 size={15} /> },
  { id: 'users', label: 'Users', icon: <Users size={15} /> },
];

const Admin = () => {
  const { user, token } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('overview');

  if (!user || !['admin', 'moderator'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <Shield size={28} className="text-red-500" />
        </div>
        <div>
          <div className="text-[18px] font-semibold text-text-primary">Access Denied</div>
          <div className="text-[13px] text-text-muted mt-1">Admin or Moderator role required.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[24px] font-semibold text-text-primary">Admin Dashboard</h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            Manage content, users, and background jobs
          </p>
        </div>
        <Badge color={user.role === 'admin' ? 'red' : 'amber'}>
          <Shield size={11} className="mr-1" />
          {user.role === 'admin' ? 'Admin' : 'Moderator'}
        </Badge>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-bg-surface border border-border-default rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-bg-panel text-text-primary shadow-sm border border-border-default'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab token={token} onTabChange={setActiveTab} />}
        {activeTab === 'affairs' && <AffairsTab token={token} />}
        {activeTab === 'quiz' && <QuizTab token={token} />}
        {activeTab === 'daily' && <DailyTab token={token} />}
        {activeTab === 'jobs' && <JobsTab token={token} />}
        {activeTab === 'users' && <UsersTab token={token} />}
      </div>
    </div>
  );
};

export default Admin;
