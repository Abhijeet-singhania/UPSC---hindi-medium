import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Search, FileText, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, MessageCircle, Loader2, PenLine, RotateCcw,
  Trophy, Timer, Award, AlertCircle, PlayCircle, Clock, TrendingUp,
  FlaskConical, ScrollText, ChevronDown, AlertTriangle, Target, Zap,
  RefreshCw
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'];
const OPTION_CHARS = ['A', 'B', 'C', 'D'];
const BOOKMARKS_KEY = 'pyq_bookmarks';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const loadBookmarks = () => {
  try { return new Set(JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')); }
  catch { return new Set(); }
};
const saveBookmarks = (set) => localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const formatTime = (secs) => {
  if (secs == null || secs < 0) return '00:00';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// Build query string, skip empty/null values
const buildQS = (params) =>
  new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();

const calcResults = (questions, answers) => {
  let correct = 0, wrong = 0, unattempted = 0;
  const subjectStats = {};
  questions.forEach(q => {
    const subj = q.subject || 'General';
    if (!subjectStats[subj]) subjectStats[subj] = { correct: 0, wrong: 0, total: 0 };
    subjectStats[subj].total++;
    const ans = answers[q.id] ?? null;
    if (!ans) { unattempted++; }
    else if (ans === q.correct_option) { correct++; subjectStats[subj].correct++; }
    else { wrong++; subjectStats[subj].wrong++; }
  });
  const rawScore = correct * 2 - wrong * (2 / 3);
  const score = parseFloat(Math.max(0, rawScore).toFixed(2));
  const maxScore = questions.length * 2;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { correct, wrong, unattempted, score, maxScore, percentage, subjectStats };
};

const getAchievements = (results, timeUsedPct) => {
  const { correct, wrong, unattempted, percentage, subjectStats } = results;
  const list = [];
  if (percentage >= 100) list.push({ id: 'flawless', icon: '✨', label: 'Flawless', desc: 'Perfect score!', cls: 'bg-yellow-50 border-yellow-300 text-yellow-800' });
  if (percentage >= 75 && percentage < 100) list.push({ id: 'topper', icon: '🏆', label: 'Topper Zone', desc: '75%+ score', cls: 'bg-blue-50 border-blue-200 text-blue-800' });
  else if (percentage >= 60 && percentage < 75) list.push({ id: 'cutoff', icon: '✅', label: 'Cutoff Safe', desc: '60%+ — safe zone', cls: 'bg-green-50 border-green-200 text-green-800' });
  if (unattempted === 0 && correct + wrong > 0) list.push({ id: 'full', icon: '💪', label: 'Full Attempt', desc: 'Every question attempted', cls: 'bg-purple-50 border-purple-200 text-purple-800' });
  if (timeUsedPct < 0.5 && correct > 0) list.push({ id: 'speed', icon: '⚡', label: 'Speed Runner', desc: 'Finished in under half the time', cls: 'bg-orange-50 border-orange-200 text-orange-800' });
  if (wrong === 0 && correct > 0) list.push({ id: 'nofail', icon: '🎯', label: 'Zero Errors', desc: 'No wrong answers', cls: 'bg-teal-50 border-teal-200 text-teal-800' });
  Object.entries(subjectStats).forEach(([subj, s]) => {
    if (s.total >= 3 && s.correct === s.total) list.push({ id: `master_${subj}`, icon: '🌟', label: `${subj} Master`, desc: `100% in ${subj}`, cls: 'bg-indigo-50 border-indigo-200 text-indigo-800' });
  });
  return list;
};

// ─── MCQPanel — used in Browse (with reveal) and Test (without reveal) ────────
const MCQPanel = ({ problem, attempt, onAttempt, testMode = false }) => {
  // In browse mode: attempt = { selected, revealed, correct } | null
  // In test mode: attempt = 'A'|'B'|'C'|'D' | null
  const selected = testMode ? (attempt ?? null) : (attempt?.selected ?? null);
  const revealed = testMode ? false : (attempt?.revealed ?? false);
  const correct = problem.correct_option;

  const selectOption = (char) => {
    if (testMode) { onAttempt(char); return; }
    if (revealed) return;
    onAttempt({ selected: char, revealed: false });
  };

  const checkAnswer = () => {
    if (!selected || revealed) return;
    onAttempt({ selected, revealed: true, correct: selected === correct });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {OPTION_KEYS.map((key, idx) => {
          const text = problem[key];
          if (!text) return null;
          const char = OPTION_CHARS[idx];
          const isSelected = selected === char;
          const isCorrect = correct === char;

          let ring = 'border-border-default hover:bg-bg-panel-hover cursor-pointer';
          let circleCls = 'border-border-default text-text-muted';

          if (!testMode && revealed) {
            if (isCorrect) { ring = 'border-[#2B7A4B] bg-[#EBF5F0]'; circleCls = 'bg-[#2B7A4B] border-[#2B7A4B] text-white'; }
            else if (isSelected) { ring = 'border-red-400 bg-red-50/40'; circleCls = 'bg-red-400 border-red-400 text-white'; }
            else { ring = 'border-border-default opacity-50'; }
          } else if (isSelected) {
            ring = 'border-primary bg-[#FDF9F5] cursor-pointer';
            circleCls = 'bg-primary border-primary text-white';
          }

          return (
            <div
              key={key}
              onClick={() => selectOption(char)}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${ring}`}
            >
              <div className={`w-6 h-6 shrink-0 border rounded-full flex items-center justify-center text-[11px] font-bold mt-[1px] ${circleCls}`}>
                {char}
              </div>
              <span className="text-[14px] text-text-primary leading-relaxed flex-1">{text}</span>
              {!testMode && revealed && isCorrect && <CheckCircle2 size={16} className="text-[#2B7A4B] ml-auto shrink-0 mt-[2px]" />}
              {!testMode && revealed && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 ml-auto shrink-0 mt-[2px]" />}
            </div>
          );
        })}
      </div>

      {!testMode && revealed && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium ${attempt?.correct ? 'bg-[#EBF5F0] text-[#2B7A4B]' : 'bg-red-50 text-red-600'}`}>
          {attempt?.correct
            ? <><CheckCircle2 size={16} /> Correct! Well done.</>
            : <><XCircle size={16} /> Incorrect. The correct answer is <strong className="ml-1">{correct}</strong>.</>}
        </div>
      )}

      {!testMode && (
        <div className="flex gap-2">
          {!revealed && (
            <button
              onClick={checkAnswer}
              disabled={!selected}
              className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-lg text-[13px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          )}
          {(revealed || selected) && (
            <button
              onClick={() => onAttempt(null)}
              className="flex items-center gap-1.5 border border-border-default text-text-muted py-2.5 px-3 rounded-lg text-[13px] hover:bg-bg-panel-hover transition cursor-pointer"
            >
              <RotateCcw size={13} /> Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MainsPanel ───────────────────────────────────────────────────────────────
const MainsPanel = ({ problem, attempt, onAttempt }) => {
  const limit = problem.word_limit || 250;
  const text = attempt?.text ?? '';
  const submitted = attempt?.submitted ?? false;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const over = wordCount > limit;

  if (submitted) {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-[#EBF5F0] border border-[#2B7A4B]/30 rounded-lg p-4 text-[13px] text-[#2B7A4B] flex items-center gap-2">
          <CheckCircle2 size={16} /> Answer saved for this session.
        </div>
        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
          <div className="text-[10px] font-bold tracking-wider text-text-muted uppercase mb-2">Your answer</div>
          <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{text}</p>
          <div className="text-[11px] text-text-muted mt-2">{wordCount} words</div>
        </div>
        <button
          onClick={() => onAttempt(null)}
          className="flex items-center gap-1.5 border border-border-default text-text-muted py-2 px-3 rounded-lg text-[12px] hover:bg-bg-panel-hover transition cursor-pointer w-fit"
        >
          <RotateCcw size={13} /> Edit answer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={e => onAttempt({ text: e.target.value, submitted: false })}
        rows={8}
        placeholder={`Write your answer here… (aim for ~${limit} words)`}
        className="w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition resize-y leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <span className={`text-[12px] font-mono ${over ? 'text-red-500' : 'text-text-muted'}`}>
          {wordCount} / {limit} words{over ? ' — over limit' : ''}
        </span>
        <button
          onClick={() => text.trim() && onAttempt({ text, submitted: true })}
          disabled={!text.trim()}
          className="bg-primary hover:bg-primary-hover text-white py-2 px-5 rounded-lg text-[13px] font-medium flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PenLine size={14} /> Save answer
        </button>
      </div>
    </div>
  );
};

// ─── BrowseView — single question card + filter panel + navigator ──────────────
const BrowseView = () => {
  const navigate = useNavigate();
  const token = useSelector(state => state.auth?.token);

  // Filters
  const [availableFilters, setAvailableFilters] = useState({ years: [], subjects: [], papers: [], exam_types: [] });
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Questions
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Interaction
  const [attempts, setAttempts] = useState({});
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());

  // Fetch filters on mount
  useEffect(() => {
    const qs = buildQS({ language: 'en' });
    fetch(`${API_BASE}/api/v1/past-year-problems/filters?${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAvailableFilters(d); })
      .catch(() => {});
  }, [token]);

  // Fetch questions whenever filters change
  const fetchQuestions = useCallback(async (extra = {}) => {
    setIsLoading(true);
    setFetchError('');
    const params = {
      language: 'en',
      limit: 100,
      year: selectedYear || undefined,
      exam_type: selectedExamType || undefined,
      subject: selectedSubject || undefined,
      paper: selectedPaper || undefined,
      search: searchInput || undefined,
      ...extra,
    };
    const qs = buildQS(params);
    try {
      const resp = await fetch(`${API_BASE}/api/v1/past-year-problems/?${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setQuestions(Array.isArray(data) ? data : []);
      setCurrentIdx(0);
    } catch {
      setFetchError('Failed to load questions. Check server connection.');
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedYear, selectedExamType, selectedSubject, selectedPaper, searchInput]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const displayed = useMemo(
    () => showBookmarksOnly ? questions.filter(q => bookmarks.has(q.id)) : questions,
    [questions, showBookmarksOnly, bookmarks]
  );

  const currentQ = displayed[currentIdx] ?? null;
  const isMCQ = !!(currentQ && (currentQ.option_a || currentQ.option_b || currentQ.option_c || currentQ.option_d));

  const toggleBookmark = useCallback((id) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveBookmarks(next);
      return next;
    });
  }, []);

  const setAttempt = useCallback((id, val) => {
    setAttempts(prev => ({ ...prev, [id]: val }));
  }, []);

  const resetFilters = () => {
    setSelectedYear(''); setSelectedExamType(''); setSelectedSubject('');
    setSelectedPaper(''); setSearchInput(''); setShowBookmarksOnly(false);
  };

  // Session stats (only MCQ-style attempts count)
  const attemptValues = Object.entries(attempts);
  const sessionDone = attemptValues.filter(([, a]) => a?.revealed || a?.submitted).length;
  const sessionCorrect = attemptValues.filter(([, a]) => a?.correct === true).length;
  const sessionWrong = attemptValues.filter(([, a]) => a?.revealed && !a?.correct).length;

  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(displayed.length - 1, idx));
    setCurrentIdx(clamped);
  };

  return (
    <div className="flex gap-4 items-start">
      {/* ── Left: Compact filter panel ── */}
      <div className="w-[210px] shrink-0 flex flex-col gap-3">
        <div className="bg-bg-panel border border-border-default rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">Filters</div>

          {/* Search */}
          <div className="flex items-center gap-2 mb-2 border border-border-default rounded-lg px-2.5 py-2 bg-bg-surface">
            <Search size={12} className="text-text-muted shrink-0" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search questions…"
              className="w-full text-[12px] outline-none bg-transparent text-text-primary placeholder-text-muted"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="text-text-muted hover:text-primary cursor-pointer">
                <XCircle size={12} />
              </button>
            )}
          </div>

          {/* Dropdowns */}
          {[
            { value: selectedExamType, set: setSelectedExamType, opts: availableFilters.exam_types || [], label: 'All exam types', fmt: v => v.toUpperCase() },
            { value: selectedYear, set: setSelectedYear, opts: availableFilters.years || [], label: 'All years' },
            { value: selectedSubject, set: setSelectedSubject, opts: availableFilters.subjects || [], label: 'All subjects' },
            { value: selectedPaper, set: setSelectedPaper, opts: availableFilters.papers || [], label: 'All papers' },
          ].map(({ value, set, opts, label, fmt }, i) => (
            <select
              key={i}
              value={value}
              onChange={e => set(e.target.value)}
              className="border border-border-default rounded-md text-[12px] px-2 py-1.5 bg-bg-surface text-text-primary w-full mb-2 cursor-pointer"
            >
              <option value="">{label}</option>
              {opts.map(o => <option key={o} value={o}>{fmt ? fmt(o) : o}</option>)}
            </select>
          ))}

          {/* Bookmarks toggle */}
          <button
            onClick={() => { setShowBookmarksOnly(v => !v); setCurrentIdx(0); }}
            className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-md text-[12px] border transition cursor-pointer mb-2 ${showBookmarksOnly ? 'bg-primary/10 border-primary text-primary' : 'bg-bg-surface border-border-default text-text-muted hover:bg-bg-panel-hover'}`}
          >
            <Bookmark size={12} /> Bookmarks {bookmarks.size > 0 && `(${bookmarks.size})`}
          </button>

          <button
            onClick={resetFilters}
            className="w-full py-1.5 px-3 rounded-md text-[12px] border border-border-default text-text-muted bg-bg-surface hover:bg-bg-panel-hover transition cursor-pointer"
          >
            Clear all filters
          </button>
        </div>

        {/* Session stats */}
        {sessionDone > 0 && (
          <div className="bg-bg-panel border border-border-default rounded-xl p-4 text-[12px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Session</span>
              <button onClick={() => setAttempts({})} className="text-[10px] text-text-muted hover:text-primary cursor-pointer flex items-center gap-1">
                <RefreshCw size={10} /> Reset
              </button>
            </div>
            <div className="flex justify-between mb-1"><span className="text-text-muted">Done</span><span className="font-medium text-text-primary">{sessionDone}</span></div>
            <div className="flex justify-between mb-1"><span className="text-[#2B7A4B]">Correct</span><span className="font-medium text-[#2B7A4B]">{sessionCorrect}</span></div>
            <div className="flex justify-between mb-2"><span className="text-red-400">Wrong</span><span className="font-medium text-red-400">{sessionWrong}</span></div>
            <div className="h-1.5 bg-border-default rounded-full overflow-hidden">
              <div className="h-full bg-[#2B7A4B] rounded-full transition-all" style={{ width: sessionDone > 0 ? `${Math.round((sessionCorrect / sessionDone) * 100)}%` : '0%' }} />
            </div>
            <div className="text-[10px] text-text-muted text-right mt-0.5">{sessionDone > 0 ? Math.round((sessionCorrect / sessionDone) * 100) : 0}% accuracy</div>
          </div>
        )}
      </div>

      {/* ── Centre: Question card ── */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 gap-3 text-text-muted bg-bg-panel border border-border-default rounded-xl">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[14px]">Loading questions…</span>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 bg-bg-panel border border-border-default rounded-xl text-center px-8">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-[14px] text-text-muted">{fetchError}</p>
            <button onClick={() => fetchQuestions()} className="text-primary text-[13px] underline cursor-pointer flex items-center gap-1.5">
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-bg-panel border border-border-default rounded-xl text-center px-8 gap-3">
            <Target size={32} className="text-text-muted" />
            <p className="text-[14px] text-text-muted font-medium">
              {showBookmarksOnly ? 'No bookmarked questions.' : 'No questions found for these filters.'}
            </p>
            {showBookmarksOnly && (
              <button onClick={() => setShowBookmarksOnly(false)} className="text-primary text-[13px] underline cursor-pointer">
                Show all questions
              </button>
            )}
          </div>
        ) : currentQ ? (
          <div className="bg-bg-panel border border-border-default rounded-xl shadow-sm overflow-hidden">
            {/* Card header: meta + actions */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#fbefe9] text-primary">{currentQ.exam_type}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#f0f0f0] text-text-muted">{currentQ.year}</span>
                {currentQ.paper && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#e6f3eb] text-[#2B7A4B]">{currentQ.paper}</span>}
                {currentQ.subject && <span className="text-[11px] text-text-muted">{currentQ.subject}</span>}
                {currentQ.topic && <span className="text-[11px] text-text-muted">· {currentQ.topic}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] text-text-muted font-medium">{currentIdx + 1} / {displayed.length}</span>
                <div className="h-4 w-px bg-border-default" />
                <button
                  onClick={() => toggleBookmark(currentQ.id)}
                  title={bookmarks.has(currentQ.id) ? 'Remove bookmark' : 'Bookmark this question'}
                  className={`p-1.5 rounded-md transition cursor-pointer ${bookmarks.has(currentQ.id) ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-primary/5'}`}
                >
                  {bookmarks.has(currentQ.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                </button>
                <button
                  onClick={() => navigate('/community')}
                  title="Ask in community"
                  className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition cursor-pointer"
                >
                  <MessageCircle size={17} />
                </button>
              </div>
            </div>

            {/* Question body */}
            <div className="px-6 py-6">
              {/* Meta chips (marks, word limit) */}
              {(currentQ.marks || currentQ.word_limit || currentQ.question_number) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentQ.question_number && <span className="text-[11px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded">{currentQ.question_number}</span>}
                  {currentQ.marks && <span className="text-[11px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded">{currentQ.marks} marks</span>}
                  {currentQ.word_limit && <span className="text-[11px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded">~{currentQ.word_limit} words</span>}
                </div>
              )}

              <p className="font-medium text-[16px] text-text-primary leading-[1.75] mb-6">{currentQ.question_text}</p>

              <div className="border-t border-border-default pt-5 mb-2">
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-text-muted mb-4">
                  {isMCQ ? 'Select the correct option' : 'Write your answer'}
                </div>
                {isMCQ ? (
                  <MCQPanel
                    problem={currentQ}
                    attempt={attempts[currentQ.id] ?? null}
                    onAttempt={val => setAttempt(currentQ.id, val)}
                  />
                ) : (
                  <MainsPanel
                    problem={currentQ}
                    attempt={attempts[currentQ.id] ?? null}
                    onAttempt={val => setAttempt(currentQ.id, val)}
                  />
                )}
              </div>

              {/* Explanation */}
              {currentQ.explanation && (!isMCQ || attempts[currentQ.id]?.revealed) && (
                <div className="mt-5 bg-[#FDF9F5] border border-[#EED4C3] rounded-lg p-4">
                  <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#9C4528] mb-2 flex items-center gap-1.5">
                    <FileText size={12} /> Explanation
                  </div>
                  <p className="text-[13px] text-[#9C4528] leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
            </div>

            {/* Navigation footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border-default bg-bg-surface/50">
              <button
                onClick={() => goTo(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 border border-border-default text-text-muted py-2 px-4 rounded-lg text-[13px] hover:bg-bg-panel-hover transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} /> Previous
              </button>

              <div className="flex items-center gap-3">
                {/* Jump to first unanswered */}
                {(() => {
                  const nextUndone = displayed.findIndex((q, i) => i > currentIdx && !attempts[q.id]?.revealed && !attempts[q.id]?.submitted);
                  return nextUndone !== -1 ? (
                    <button
                      onClick={() => goTo(nextUndone)}
                      className="text-[12px] text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap size={12} /> Skip to unanswered
                    </button>
                  ) : null;
                })()}
                {/* Jump to next bookmark */}
                {bookmarks.size > 0 && (() => {
                  const nextBk = displayed.findIndex((q, i) => i > currentIdx && bookmarks.has(q.id));
                  return nextBk !== -1 ? (
                    <button
                      onClick={() => goTo(nextBk)}
                      className="text-[12px] text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Bookmark size={12} /> Next bookmark
                    </button>
                  ) : null;
                })()}
              </div>

              <button
                onClick={() => goTo(currentIdx + 1)}
                disabled={currentIdx >= displayed.length - 1}
                className="flex items-center gap-1.5 border border-border-default text-text-muted py-2 px-4 rounded-lg text-[13px] hover:bg-bg-panel-hover transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Right: Question navigator ── */}
      {displayed.length > 0 && (
        <div className="w-[180px] shrink-0">
          <div className="bg-bg-panel border border-border-default rounded-xl p-4 sticky top-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Questions
            </div>
            <div className="text-[11px] text-text-muted mb-3">{displayed.length} loaded</div>

            <div className="grid grid-cols-5 gap-1 mb-4 max-h-[300px] overflow-y-auto">
              {displayed.map((q, i) => {
                const att = attempts[q.id];
                const done = att?.revealed || att?.submitted;
                const isCorrect = att?.correct === true;
                const bk = bookmarks.has(q.id);
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    title={`Q${i + 1}${done ? (isCorrect ? ' ✓' : ' ✗') : bk ? ' 🔖' : ''}`}
                    className={`w-7 h-7 rounded text-[10px] font-semibold cursor-pointer transition border ${
                      isCurrent
                        ? 'bg-primary text-white border-primary ring-2 ring-primary ring-offset-1'
                        : done && isCorrect
                        ? 'bg-[#2B7A4B] text-white border-[#2B7A4B]'
                        : done && !isCorrect
                        ? 'bg-red-500 text-white border-red-500'
                        : bk
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-bg-surface border-border-default text-text-muted hover:bg-bg-panel-hover'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-1.5 text-[10px] text-text-muted border-t border-border-default pt-3">
              {[
                { cls: 'bg-primary', label: 'Current' },
                { cls: 'bg-[#2B7A4B]', label: 'Correct' },
                { cls: 'bg-red-500', label: 'Wrong' },
                { cls: 'bg-primary/10 border border-primary/30', label: 'Bookmarked' },
              ].map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${cls}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-3 pt-3 border-t border-border-default">
              <div className="h-1.5 bg-border-default rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2B7A4B] rounded-full transition-all"
                  style={{ width: `${displayed.length > 0 ? Math.round((sessionDone / displayed.length) * 100) : 0}%` }}
                />
              </div>
              <div className="text-[10px] text-text-muted mt-1">{sessionDone}/{displayed.length} answered</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TestConfigView ───────────────────────────────────────────────────────────
const TestConfigView = ({ filterData, config, setConfig, onStart, isLoading, startError }) => {
  const filters = filterData || {};
  const NUM_OPTIONS = [10, 20, 30, 50, 100];
  const TIME_DEFAULTS = {
    prelims: { 10: 15, 20: 25, 30: 40, 50: 60, 100: 120 },
    mains: { 10: 60, 20: 120, 30: 180, 50: 300, 100: 600 },
  };

  const handleNumChange = (n) => {
    const auto = (TIME_DEFAULTS[config.examType] || TIME_DEFAULTS.prelims)[n] || Math.ceil(n * 1.5);
    setConfig(c => ({ ...c, numQuestions: n, timeMinutes: auto }));
  };

  const handleExamTypeChange = (et) => {
    const auto = (TIME_DEFAULTS[et] || TIME_DEFAULTS.prelims)[config.numQuestions] || 60;
    setConfig(c => ({ ...c, examType: et, timeMinutes: auto }));
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-bg-panel border border-border-default rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <PlayCircle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-serif text-[20px] font-semibold text-text-primary">Configure Mock Test</h3>
              <p className="text-[13px] text-text-muted">Set up your timed practice session</p>
            </div>
          </div>
        </div>

        <div className="p-8 flex flex-col gap-6">
          {/* Exam type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Exam Type</label>
            <div className="flex gap-3">
              {[
                { id: 'prelims', label: '🎯 Prelims (MCQ)', desc: '+2 / −⅔ scoring' },
                { id: 'mains', label: '✍️ Mains (Subjective)', desc: 'Written answers' },
              ].map(et => (
                <button
                  key={et.id}
                  onClick={() => handleExamTypeChange(et.id)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-left transition cursor-pointer ${config.examType === et.id ? 'border-primary bg-primary/10' : 'border-border-default hover:bg-bg-surface'}`}
                >
                  <div className={`text-[13px] font-medium ${config.examType === et.id ? 'text-primary' : 'text-text-primary'}`}>{et.label}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{et.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Subject</label>
              <select
                value={config.subject}
                onChange={e => setConfig(c => ({ ...c, subject: e.target.value }))}
                className="w-full border border-border-default rounded-lg text-[13px] px-3 py-2.5 bg-bg-surface text-text-primary cursor-pointer"
              >
                <option value="">All subjects</option>
                {(filters.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Year</label>
              <select
                value={config.year}
                onChange={e => setConfig(c => ({ ...c, year: e.target.value }))}
                className="w-full border border-border-default rounded-lg text-[13px] px-3 py-2.5 bg-bg-surface text-text-primary cursor-pointer"
              >
                <option value="">All years</option>
                {(filters.years || []).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Number of questions */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Number of Questions</label>
            <div className="flex gap-2 flex-wrap">
              {NUM_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => handleNumChange(n)}
                  className={`py-2.5 px-5 rounded-xl border text-[13px] font-medium transition cursor-pointer ${config.numQuestions === n ? 'border-primary bg-primary/10 text-primary' : 'border-border-default text-text-muted hover:bg-bg-surface'}`}
                >
                  {n}Q
                </button>
              ))}
            </div>
          </div>

          {/* Time limit */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
              Time Limit — <span className="font-normal normal-case text-text-primary font-semibold">{config.timeMinutes} minutes</span>
            </label>
            <input
              type="range" min="10" max="180" step="5"
              value={config.timeMinutes}
              onChange={e => setConfig(c => ({ ...c, timeMinutes: Number(e.target.value) }))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>10 min</span><span>1 hr 30 min</span><span>3 hrs</span>
            </div>
          </div>

          {/* Summary row */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-4 flex items-center gap-3 text-[13px]">
            <Clock size={18} className="text-text-muted shrink-0" />
            <span className="text-text-muted flex-1">
              <strong className="text-text-primary">{config.numQuestions} questions</strong> in{' '}
              <strong className="text-text-primary">{config.timeMinutes} min</strong>
              {config.examType === 'prelims' && <> · Scoring: <strong>+2</strong> correct, <strong>−⅔</strong> wrong</>}
            </span>
          </div>

          {startError && (
            <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={15} className="shrink-0" /> {startError}
            </div>
          )}

          <button
            onClick={onStart}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><Loader2 size={18} className="animate-spin" /> Loading questions…</>
              : <><PlayCircle size={18} /> Start Mock Test</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TestRunningView ──────────────────────────────────────────────────────────
const TestRunningView = ({ questions, answers, onSetAnswer, currentIdx, setCurrentIdx, timeLeft, totalSecs, onSubmit }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const q = questions[currentIdx];
  if (!q) return null;

  const answeredCount = Object.keys(answers).length;
  const unattempted = questions.length - answeredCount;
  const isRed = timeLeft != null && timeLeft < 300;
  const timeProgress = totalSecs > 0 ? Math.max(0, timeLeft / totalSecs) : 0;

  return (
    <div className="flex gap-5 items-start">
      {/* Main question area */}
      <div className="flex-1 min-w-0">
        {/* Top bar with timer */}
        <div className="bg-bg-panel border border-border-default rounded-xl px-5 py-3 mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-text-primary">
              Q{currentIdx + 1} <span className="text-text-muted font-normal">of {questions.length}</span>
            </span>
            {q.subject && (
              <span className="text-[11px] bg-bg-surface border border-border-default px-2 py-0.5 rounded text-text-muted">{q.subject}</span>
            )}
          </div>
          <div className={`flex items-center gap-2 font-mono text-[22px] font-bold tabular-nums ${isRed ? 'text-red-500' : 'text-text-primary'}`}>
            <Timer size={18} className={isRed ? 'text-red-500' : 'text-text-muted'} />
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg text-[13px] font-medium cursor-pointer transition flex items-center gap-2"
          >
            <Award size={15} /> Submit Test
          </button>
        </div>

        {/* Timer progress bar */}
        <div className="h-1 bg-border-default rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isRed ? 'bg-red-500' : 'bg-primary'}`}
            style={{ width: `${timeProgress * 100}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-bg-panel border border-border-default rounded-xl p-6 mb-4">
          <div className="flex gap-2 flex-wrap mb-4">
            {q.year && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#fbefe9] text-primary">PYQ {q.year}</span>}
            {q.paper && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-bg-surface border border-border-default text-text-muted">{q.paper}</span>}
          </div>

          <p className="font-medium text-[16px] text-text-primary leading-[1.7] mb-6">{q.question_text}</p>

          <MCQPanel
            problem={q}
            attempt={answers[q.id] ?? null}
            onAttempt={val => onSetAnswer(q.id, val)}
            testMode
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 border border-border-default text-text-muted py-2 px-4 rounded-lg text-[13px] hover:bg-bg-panel-hover transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span className="text-[12px] text-text-muted">
            {answeredCount} answered · {unattempted} remaining
          </span>
          <button
            onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
            disabled={currentIdx === questions.length - 1}
            className="flex items-center gap-1.5 border border-border-default text-text-muted py-2 px-4 rounded-lg text-[13px] hover:bg-bg-panel-hover transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Question palette */}
      <div className="w-[200px] shrink-0">
        <div className="bg-bg-panel border border-border-default rounded-xl p-4 sticky top-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Question Palette</div>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {questions.map((ques, i) => {
              const isAnswered = !!answers[ques.id];
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  title={`Q${i + 1}${isAnswered ? ' (answered)' : ''}`}
                  className={`w-8 h-8 rounded-md text-[11px] font-semibold cursor-pointer transition border ${
                    isCurrent
                      ? 'bg-primary text-white border-primary ring-2 ring-primary ring-offset-1'
                      : isAnswered
                      ? 'bg-[#2B7A4B] text-white border-[#2B7A4B]'
                      : 'bg-bg-surface border-border-default text-text-muted hover:bg-bg-panel-hover'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-1 text-[10px] text-text-muted">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /> Current</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#2B7A4B]" /> Answered ({answeredCount})</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-bg-surface border border-border-default" /> Not answered ({unattempted})</div>
          </div>

          {/* Progress */}
          <div className="mt-3 pt-3 border-t border-border-default">
            <div className="h-1.5 bg-border-default rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2B7A4B] rounded-full transition-all"
                style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-text-muted mt-1">{Math.round((answeredCount / questions.length) * 100)}% complete</div>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-panel rounded-2xl p-6 max-w-sm w-full shadow-xl border border-border-default">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-text-primary text-[16px]">Submit Test?</h3>
                <p className="text-[13px] text-text-muted">This cannot be undone.</p>
              </div>
            </div>
            <div className="bg-bg-surface rounded-xl p-4 mb-5 text-[13px] flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Answered</span>
                <span className="font-semibold text-[#2B7A4B]">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Unattempted</span>
                <span className={`font-semibold ${unattempted > 0 ? 'text-red-500' : 'text-text-muted'}`}>{unattempted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Time remaining</span>
                <span className="font-semibold text-text-primary">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-border-default text-text-muted py-2.5 rounded-xl text-[13px] hover:bg-bg-surface transition cursor-pointer"
              >
                Continue Test
              </button>
              <button
                onClick={() => { setShowConfirm(false); onSubmit(); }}
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-[13px] font-semibold transition cursor-pointer"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TestResultsView ──────────────────────────────────────────────────────────
const TestResultsView = ({ questions, answers, elapsedSecs, totalSecs, config, onReset, onBrowse }) => {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const results = useMemo(() => calcResults(questions, answers), [questions, answers]);
  const timeUsedPct = totalSecs > 0 ? (elapsedSecs ?? totalSecs) / totalSecs : 1;
  const achievements = useMemo(() => getAchievements(results, timeUsedPct), [results, timeUsedPct]);
  const { correct, wrong, unattempted, score, maxScore, percentage, subjectStats } = results;

  const scoreCls = percentage >= 60 ? 'text-[#2B7A4B]' : percentage >= 40 ? 'text-yellow-600' : 'text-red-500';
  const scoreLabel = percentage >= 75 ? '🏆 Topper Zone' : percentage >= 60 ? '✅ Cutoff Safe' : percentage >= 40 ? '⚠️ Below Cutoff' : '❌ Needs Work';

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Score card */}
      <div className="bg-bg-panel border border-border-default rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border-default flex items-center justify-between">
          <h3 className="font-serif text-[18px] font-semibold text-text-primary flex items-center gap-2">
            <Trophy size={20} className="text-primary" /> Test Results
          </h3>
          <span className="text-[12px] text-text-muted">
            {config.examType?.toUpperCase()} · {questions.length}Q · {formatTime(totalSecs)} allotted
          </span>
        </div>

        <div className="p-6 flex items-center gap-6 flex-wrap">
          <div className="text-center min-w-[100px]">
            <div className={`text-[52px] font-serif font-bold leading-none ${scoreCls}`}>{score}</div>
            <div className="text-[13px] text-text-muted">/ {maxScore} marks</div>
            <div className={`text-[12px] font-semibold mt-1.5 ${scoreCls}`}>{scoreLabel}</div>
          </div>
          <div className="h-16 w-px bg-border-default hidden sm:block" />
          <div className="flex gap-3 flex-1 flex-wrap">
            {[
              { label: 'Correct', val: correct, bg: 'bg-[#EBF5F0]', cls: 'text-[#2B7A4B]' },
              { label: 'Wrong', val: wrong, bg: 'bg-red-50', cls: 'text-red-600' },
              { label: 'Skipped', val: unattempted, bg: 'bg-bg-surface', cls: 'text-text-muted' },
            ].map(({ label, val, bg, cls }) => (
              <div key={label} className={`${bg} rounded-xl p-4 flex-1 min-w-[80px] text-center`}>
                <div className={`text-[28px] font-serif font-bold ${cls}`}>{val}</div>
                <div className={`text-[11px] font-semibold ${cls}`}>{label}</div>
              </div>
            ))}
          </div>
          <div className="h-16 w-px bg-border-default hidden sm:block" />
          <div className="text-center min-w-[90px]">
            <div className={`text-[36px] font-serif font-bold ${scoreCls}`}>{percentage}%</div>
            <div className="text-[11px] text-text-muted flex items-center justify-center gap-1 mt-1">
              <Clock size={12} /> {formatTime(elapsedSecs)} used
            </div>
          </div>
        </div>

        {config.examType === 'prelims' && (
          <div className="px-6 pb-4">
            <p className="text-[12px] text-text-muted bg-bg-surface border border-border-default rounded-lg px-4 py-2.5">
              <strong>UPSC Prelims scoring:</strong> +2 correct · −0.67 wrong · 0 skipped · Your score: <strong className={scoreCls}>{score}</strong> / {maxScore}
            </p>
          </div>
        )}
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-bg-panel border border-border-default rounded-2xl p-5">
          <h4 className="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Award size={18} className="text-primary" /> Achievements Unlocked
          </h4>
          <div className="flex flex-wrap gap-3">
            {achievements.map(a => (
              <div key={a.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${a.cls}`}>
                <span className="text-[20px]">{a.icon}</span>
                <div>
                  <div className="text-[13px] font-semibold">{a.label}</div>
                  <div className="text-[11px] opacity-80">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject performance */}
      {Object.keys(subjectStats).length > 0 && (
        <div className="bg-bg-panel border border-border-default rounded-2xl p-5">
          <h4 className="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> Subject-wise Performance
          </h4>
          <div className="flex flex-col gap-3">
            {Object.entries(subjectStats)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([subj, s]) => {
                const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                const color = pct >= 60 ? '#2B7A4B' : pct >= 40 ? '#C0933C' : '#D34335';
                return (
                  <div key={subj}>
                    <div className="flex justify-between items-center text-[13px] mb-1.5">
                      <span className="text-text-primary font-medium">{subj}</span>
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="text-[#2B7A4B]">{s.correct}✓</span>
                        <span className="text-red-500">{s.wrong}✗</span>
                        <span className="text-text-muted font-semibold w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-border-default rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Question review */}
      <div className="bg-bg-panel border border-border-default rounded-2xl p-5">
        <h4 className="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FileText size={18} className="text-primary" /> Question Review
        </h4>
        <div className="flex flex-col gap-2">
          {questions.map((q, i) => {
            const ans = answers[q.id] ?? null;
            const isCorrect = ans && ans === q.correct_option;
            const isWrong = ans && ans !== q.correct_option;
            const isSkipped = !ans;
            const isOpen = expandedIdx === i;

            return (
              <div
                key={q.id}
                className={`border rounded-xl overflow-hidden ${isCorrect ? 'border-[#2B7A4B]/40' : isWrong ? 'border-red-200' : 'border-border-default'}`}
              >
                <button
                  onClick={() => setExpandedIdx(isOpen ? null : i)}
                  className={`w-full flex items-center gap-3 p-3.5 text-left hover:bg-bg-surface transition cursor-pointer ${isCorrect ? 'bg-[#EBF5F0]/40' : isWrong ? 'bg-red-50/40' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isCorrect ? 'bg-[#2B7A4B] text-white' : isWrong ? 'bg-red-500 text-white' : 'bg-border-default text-text-muted'}`}>
                    {i + 1}
                  </div>
                  <p className="text-[13px] text-text-primary flex-1 line-clamp-1">{q.question_text}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCorrect && <CheckCircle2 size={15} className="text-[#2B7A4B]" />}
                    {isWrong && <XCircle size={15} className="text-red-500" />}
                    {isSkipped && <span className="text-[11px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded">Skipped</span>}
                    <ChevronDown size={14} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-3 border-t border-border-default bg-bg-surface/50">
                    <p className="text-[14px] text-text-primary font-medium leading-relaxed mb-4">{q.question_text}</p>
                    <div className="flex flex-col gap-1.5 mb-4">
                      {OPTION_KEYS.map((key, idx) => {
                        const text = q[key];
                        if (!text) return null;
                        const char = OPTION_CHARS[idx];
                        const isCrt = char === q.correct_option;
                        const isMyAns = char === ans;
                        return (
                          <div
                            key={key}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg text-[13px] border ${isCrt ? 'bg-[#EBF5F0] border-[#2B7A4B]/40 text-[#2B7A4B]' : isMyAns && !isCrt ? 'bg-red-50 border-red-200 text-red-600' : 'bg-bg-panel border-border-default text-text-muted'}`}
                          >
                            <span className="font-bold w-4 shrink-0">{char}.</span>
                            <span className="flex-1">{text}</span>
                            {isCrt && <CheckCircle2 size={14} className="shrink-0" />}
                            {isMyAns && !isCrt && <XCircle size={14} className="shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    {isSkipped && (
                      <p className="text-[12px] text-text-muted mb-3 flex items-center gap-1.5">
                        <AlertCircle size={13} /> Skipped — correct answer: <strong className="text-text-primary ml-1">{q.correct_option}</strong>
                      </p>
                    )}
                    {q.explanation && (
                      <div className="bg-[#FDF9F5] border border-[#EED4C3] rounded-lg p-3.5 text-[13px] text-[#9C4528]">
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><FileText size={10} /> Explanation</div>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center pb-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 border border-primary text-primary py-3 px-6 rounded-xl text-[14px] font-medium hover:bg-primary/5 transition cursor-pointer"
        >
          <RotateCcw size={16} /> Take Another Test
        </button>
        <button
          onClick={onBrowse}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 px-6 rounded-xl text-[14px] font-medium transition cursor-pointer"
        >
          <ScrollText size={16} /> Browse Questions
        </button>
      </div>
    </div>
  );
};

// ─── Main PracticeLab ─────────────────────────────────────────────────────────
const PracticeLab = () => {
  const token = useSelector(state => state.auth?.token);

  const [activeTab, setActiveTab] = useState('browse');
  const [testPhase, setTestPhase] = useState('config'); // 'config' | 'running' | 'results'
  const [config, setConfig] = useState({ examType: 'prelims', subject: '', year: '', numQuestions: 30, timeMinutes: 40 });
  const [filterData, setFilterData] = useState(null);

  // Test state
  const [testQuestions, setTestQuestions] = useState([]);
  const [testAnswers, setTestAnswers] = useState({});
  const [currentTestIdx, setCurrentTestIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [totalTestSecs, setTotalTestSecs] = useState(null);
  const [elapsedSecs, setElapsedSecs] = useState(null);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [startError, setStartError] = useState('');
  const timerRef = useRef(null);

  // Load filter data once
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/past-year-problems/filters?language=en`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFilterData(d); })
      .catch(() => {});
  }, [token]);

  // Timer countdown
  useEffect(() => {
    if (testPhase !== 'running' || timeLeft == null) return;
    if (timeLeft <= 0) { doSubmitTest(0); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, testPhase]);

  const doSubmitTest = useCallback((remainingOverride = null) => {
    clearTimeout(timerRef.current);
    const rem = remainingOverride != null ? remainingOverride : timeLeft ?? 0;
    const total = totalTestSecs ?? 0;
    setElapsedSecs(Math.max(0, total - rem));
    setTestPhase('results');
  }, [timeLeft, totalTestSecs]);

  // ── Direct fetch for test questions (avoids useApi stale-data issues) ────────
  const handleStart = useCallback(async () => {
    setStartError('');
    setIsTestLoading(true);

    const params = {
      exam_type: config.examType,
      language: 'en',
      limit: 100,  // server hard-cap is le=100
      ...(config.subject ? { subject: config.subject } : {}),
      ...(config.year ? { year: config.year } : {}),
    };
    const qs = buildQS(params);

    try {
      const resp = await fetch(`${API_BASE}/api/v1/past-year-problems/?${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const available = Array.isArray(data) ? data : [];
      if (available.length === 0) {
        setStartError('No questions found for this configuration. Try different filters.');
        setIsTestLoading(false);
        return;
      }

      const picked = shuffle(available).slice(0, Math.min(config.numQuestions, available.length));
      const totalSecs = config.timeMinutes * 60;

      setTestQuestions(picked);
      setTestAnswers({});
      setCurrentTestIdx(0);
      setTotalTestSecs(totalSecs);
      setTimeLeft(totalSecs);
      setElapsedSecs(null);
      setTestPhase('running');
    } catch {
      setStartError('Failed to load questions. Please check your server connection and try again.');
    } finally {
      setIsTestLoading(false);
    }
  }, [config, token]);

  const resetTest = useCallback(() => {
    clearTimeout(timerRef.current);
    setTestPhase('config');
    setTestQuestions([]);
    setTestAnswers({});
    setTimeLeft(null);
    setElapsedSecs(null);
    setStartError('');
  }, []);

  const setTestAnswer = useCallback((qId, val) => {
    setTestAnswers(prev => {
      if (val === null) { const n = { ...prev }; delete n[qId]; return n; }
      return { ...prev, [qId]: val };
    });
  }, []);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-serif text-[28px] font-semibold text-text-primary mb-1">Practice Lab</h2>
          <p className="text-text-muted text-[13px]">
            Browse PYQs with instant answers · Timed mock tests · Full post-test analysis
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-bg-surface border border-border-default rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition cursor-pointer ${activeTab === 'browse' ? 'bg-bg-panel text-text-primary shadow-sm border border-border-default' : 'text-text-muted hover:text-text-primary'}`}
        >
          <ScrollText size={15} /> Browse & Practice
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`flex items-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition cursor-pointer ${activeTab === 'test' ? 'bg-bg-panel text-text-primary shadow-sm border border-border-default' : 'text-text-muted hover:text-text-primary'}`}
        >
          <FlaskConical size={15} /> Mock Test
          {testPhase === 'running' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-0.5" />}
        </button>
      </div>

      {/* Browse tab */}
      {activeTab === 'browse' && <BrowseView />}

      {/* Mock test: config */}
      {activeTab === 'test' && testPhase === 'config' && (
        <TestConfigView
          filterData={filterData}
          config={config}
          setConfig={setConfig}
          onStart={handleStart}
          isLoading={isTestLoading}
          startError={startError}
        />
      )}

      {/* Mock test: running */}
      {activeTab === 'test' && testPhase === 'running' && (
        <TestRunningView
          questions={testQuestions}
          answers={testAnswers}
          onSetAnswer={setTestAnswer}
          currentIdx={currentTestIdx}
          setCurrentIdx={setCurrentTestIdx}
          timeLeft={timeLeft}
          totalSecs={totalTestSecs}
          onSubmit={doSubmitTest}
        />
      )}

      {/* Mock test: results */}
      {activeTab === 'test' && testPhase === 'results' && (
        <TestResultsView
          questions={testQuestions}
          answers={testAnswers}
          elapsedSecs={elapsedSecs}
          totalSecs={totalTestSecs}
          config={config}
          onReset={resetTest}
          onBrowse={() => setActiveTab('browse')}
        />
      )}
    </div>
  );
};

export default PracticeLab;
