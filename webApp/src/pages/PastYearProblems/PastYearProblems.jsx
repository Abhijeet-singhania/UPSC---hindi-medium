import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search, CalendarRange, FileText, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  MessageCircle, Loader2, PenLine, RotateCcw, Trophy
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'];
const OPTION_CHARS = ['A', 'B', 'C', 'D'];
const BOOKMARKS_KEY = 'pyq_bookmarks';

// ─── localStorage bookmark helpers ────────────────────────────────────────────
function loadBookmarks() {
  try { return new Set(JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveBookmarks(set) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
}

// ─── MCQ interactive panel ────────────────────────────────────────────────────
const MCQPanel = ({ problem, attempt, onAttempt }) => {
  const selected = attempt?.selected ?? null;
  const revealed = attempt?.revealed ?? false;
  const correct = problem.correct_option;

  const selectOption = (char) => {
    if (revealed) return;
    onAttempt({ selected: char, revealed: false });
  };

  const checkAnswer = () => {
    if (!selected || revealed) return;
    const isCorrect = selected === correct;
    onAttempt({ selected, revealed: true, correct: isCorrect });
  };

  const reset = () => onAttempt(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Options */}
      <div className="flex flex-col gap-2">
        {OPTION_KEYS.map((key, idx) => {
          const text = problem[key];
          if (!text) return null;
          const char = OPTION_CHARS[idx];
          const isSelected = selected === char;
          const isCorrect = correct === char;

          let ring = 'border-border-default hover:bg-bg-panel-hover';
          let circleCls = 'border-border-default text-text-muted';

          if (revealed) {
            if (isCorrect) {
              ring = 'border-[#2B7A4B] bg-[#EBF5F0]';
              circleCls = 'bg-[#2B7A4B] border-[#2B7A4B] text-white';
            } else if (isSelected) {
              ring = 'border-red-400 bg-red-50/40';
              circleCls = 'bg-red-400 border-red-400 text-white';
            } else {
              ring = 'border-border-default opacity-50';
            }
          } else if (isSelected) {
            ring = 'border-primary bg-[#FDF9F5]';
            circleCls = 'bg-primary border-primary text-white';
          }

          return (
            <div
              key={key}
              onClick={() => selectOption(char)}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${ring}`}
            >
              <div className={`w-6 h-6 shrink-0 border rounded-full flex items-center justify-center text-[11px] font-bold mt-[1px] ${circleCls}`}>
                {char}
              </div>
              <span className="text-[13px] text-text-primary leading-relaxed">{text}</span>
              {revealed && isCorrect && <CheckCircle2 size={16} className="text-[#2B7A4B] ml-auto shrink-0 mt-[2px]" />}
              {revealed && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 ml-auto shrink-0 mt-[2px]" />}
            </div>
          );
        })}
      </div>

      {/* Result banner */}
      {revealed && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium ${
          attempt?.correct ? 'bg-[#EBF5F0] text-[#2B7A4B]' : 'bg-red-50 text-red-600'
        }`}>
          {attempt?.correct
            ? <><CheckCircle2 size={16} /> Correct! Well done.</>
            : <><XCircle size={16} /> Incorrect. The answer is <strong className="ml-1">{correct}</strong>.</>}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!revealed && (
          <button
            onClick={checkAnswer}
            disabled={!selected}
            className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg text-[13px] font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
        )}
        {(revealed || selected) && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 border border-border-default text-text-muted py-2 px-3 rounded-lg text-[12px] hover:bg-bg-panel-hover transition cursor-pointer"
          >
            <RotateCcw size={13} /> Try again
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Mains text-answer panel ──────────────────────────────────────────────────
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
        rows={7}
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

// ─── Main component ───────────────────────────────────────────────────────────
const PastYearProblems = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Filters
  const [filters, setFilters] = useState({ years: [], subjects: [], papers: [], exam_types: [] });
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // List + selection
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Session state: { [problemId]: attempt }
  const [attempts, setAttempts] = useState({});

  // Bookmarks persisted to localStorage
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());

  // Show only bookmarked
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const language = useMemo(() => (i18n.language === 'en' ? 'en' : 'hi'), [i18n.language]);

  const {
    data: filterData,
    execute: loadFilters,
  } = useApi(`${API_BASE_URL}/api/v1/past-year-problems/filters`);

  const {
    data: problemsData,
    isLoading: isLoadingProblems,
    error: problemsError,
    execute: loadProblems,
  } = useApi(`${API_BASE_URL}/api/v1/past-year-problems/`);

  useEffect(() => {
    loadFilters({ queryParams: { language } }).catch(() => {});
  }, [language]);

  useEffect(() => {
    if (filterData) setFilters(filterData);
  }, [filterData]);

  useEffect(() => {
    setSelectedIdx(0);
    loadProblems({
      queryParams: {
        language,
        year: selectedYear || undefined,
        exam_type: selectedExamType || undefined,
        subject: selectedSubject || undefined,
        paper: selectedPaper || undefined,
        search: searchInput || undefined,
        limit: 50,
      },
    }).catch(() => {});
  }, [language, selectedYear, selectedExamType, selectedSubject, selectedPaper, searchInput]);

  const problems = useMemo(() => {
    const list = Array.isArray(problemsData) ? problemsData : [];
    if (showBookmarksOnly) return list.filter(p => bookmarks.has(p.id));
    return list;
  }, [problemsData, showBookmarksOnly, bookmarks]);

  const selectedProblem = problems[selectedIdx] ?? null;

  const isMCQ = !!(
    selectedProblem &&
    (selectedProblem.option_a || selectedProblem.option_b || selectedProblem.option_c || selectedProblem.option_d)
  );

  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveBookmarks(next);
      return next;
    });
  };

  const setAttempt = useCallback((problemId, value) => {
    setAttempts(prev => ({ ...prev, [problemId]: value }));
  }, []);

  const resetFilters = () => {
    setSelectedYear('');
    setSelectedExamType('');
    setSelectedSubject('');
    setSelectedPaper('');
    setSearchInput('');
    setShowBookmarksOnly(false);
  };

  // Session stats
  const attempted = Object.keys(attempts).length;
  const correct = Object.values(attempts).filter(a => a?.correct === true).length;

  const postToCommunity = () => {
    if (!selectedProblem) return;
    navigate('/community');
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-serif text-[28px] font-semibold text-text-primary mb-1">
            {t('pastYearProblems.title')}
          </h2>
          <p className="text-text-muted text-[13px]">{t('pastYearProblems.subtitle')}</p>
        </div>
        {attempted > 0 && (
          <div className="flex items-center gap-2 bg-bg-panel border border-border-default rounded-xl px-4 py-2.5 text-[12px]">
            <Trophy size={14} className="text-primary" />
            <span className="text-text-muted">Session:</span>
            <span className="font-medium text-text-primary">{correct}/{attempted} correct</span>
          </div>
        )}
      </div>

      <div className="flex gap-5 items-start">
        {/* ── Left: Filters ── */}
        <div className="w-[240px] shrink-0 flex flex-col gap-3">
          <div className="bg-bg-panel border border-border-default rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={t('pastYearProblems.searchPlaceholder')}
                className="w-full text-[13px] outline-none bg-transparent text-text-primary placeholder-text-muted"
              />
            </div>

            <div className="flex flex-col gap-2">
              <select
                value={selectedExamType}
                onChange={e => setSelectedExamType(e.target.value)}
                className="border border-border-default rounded-md text-[12px] px-2 py-1.5 bg-bg-surface text-text-primary w-full"
              >
                <option value="">All exam types</option>
                {(filters.exam_types || []).map(et => (
                  <option key={et} value={et}>{et.toUpperCase()}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="border border-border-default rounded-md text-[12px] px-2 py-1.5 bg-bg-surface text-text-primary w-full"
              >
                <option value="">All years</option>
                {(filters.years || []).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="border border-border-default rounded-md text-[12px] px-2 py-1.5 bg-bg-surface text-text-primary w-full"
              >
                <option value="">All subjects</option>
                {(filters.subjects || []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={selectedPaper}
                onChange={e => setSelectedPaper(e.target.value)}
                className="border border-border-default rounded-md text-[12px] px-2 py-1.5 bg-bg-surface text-text-primary w-full"
              >
                <option value="">All papers</option>
                {(filters.papers || []).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 mt-3">
              <button
                onClick={() => setShowBookmarksOnly(v => !v)}
                className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-md text-[12px] border transition cursor-pointer ${
                  showBookmarksOnly
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-bg-surface border-border-default text-text-muted hover:bg-bg-panel-hover'
                }`}
              >
                <Bookmark size={13} /> Bookmarks only {bookmarks.size > 0 && `(${bookmarks.size})`}
              </button>
              <button
                onClick={resetFilters}
                className="w-full py-1.5 px-3 rounded-md text-[12px] border border-border-default text-text-muted bg-bg-surface hover:bg-bg-panel-hover transition cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          </div>

          {/* Mini session stats */}
          {attempted > 0 && (
            <div className="bg-bg-panel border border-border-default rounded-xl p-4 text-[12px]">
              <div className="text-text-muted mb-2 font-semibold uppercase tracking-wider text-[10px]">Session</div>
              <div className="flex justify-between mb-1">
                <span className="text-text-muted">Attempted</span>
                <span className="font-medium text-text-primary">{attempted}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-[#2B7A4B]">Correct</span>
                <span className="font-medium text-[#2B7A4B]">{correct}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Wrong</span>
                <span className="font-medium text-red-400">
                  {Object.values(attempts).filter(a => a?.revealed && !a?.correct).length}
                </span>
              </div>
              <div className="h-1 bg-border-default rounded-full mt-3">
                <div
                  className="h-full bg-[#2B7A4B] rounded-full transition-all"
                  style={{ width: attempted > 0 ? `${Math.round((correct / attempted) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Centre: Question list ── */}
        <div className="w-[280px] shrink-0 flex flex-col gap-2">
          {/* Count + loading */}
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[12px] text-text-muted">
              {isLoadingProblems ? 'Loading…' : `${problems.length} questions`}
            </span>
            {isLoadingProblems && <Loader2 size={13} className="animate-spin text-text-muted" />}
          </div>

          {problemsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[12px] text-red-500">
              {t('pastYearProblems.errorLoading')}
            </div>
          )}

          {!isLoadingProblems && problems.length === 0 && (
            <div className="bg-bg-panel border border-border-default rounded-xl p-5 text-[13px] text-text-muted text-center">
              {showBookmarksOnly ? 'No bookmarked questions.' : t('pastYearProblems.noData')}
            </div>
          )}

          <div className="flex flex-col gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {problems.map((problem, idx) => {
              const att = attempts[problem.id];
              const done = att?.revealed || att?.submitted;
              const iscorrect = att?.correct;
              const bk = bookmarks.has(problem.id);

              return (
                <button
                  key={problem.id}
                  onClick={() => setSelectedIdx(idx)}
                  className={`text-left rounded-xl p-3 border transition-all cursor-pointer relative ${
                    idx === selectedIdx
                      ? 'border-primary bg-primary/5'
                      : 'border-border-default bg-bg-panel hover:bg-bg-panel-hover'
                  }`}
                >
                  {/* Status dot */}
                  {done && (
                    <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${iscorrect ? 'bg-[#2B7A4B]' : 'bg-red-400'}`} />
                  )}
                  {bk && !done && (
                    <Bookmark size={10} className="absolute top-2.5 right-2.5 text-primary" fill="currentColor" />
                  )}

                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#fbefe9] text-primary">
                      {problem.exam_type}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#f0f0f0] text-text-muted">
                      {problem.year}
                    </span>
                    {problem.subject && (
                      <span className="text-[9px] text-text-muted">{problem.subject}</span>
                    )}
                  </div>
                  <p className="text-[12px] text-text-primary leading-snug line-clamp-2">
                    {problem.question_text}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Interactive detail panel ── */}
        <div className="flex-1 min-w-0">
          {!selectedProblem ? (
            <div className="bg-bg-panel border border-border-default rounded-xl p-10 text-center text-text-muted text-[13px]">
              {t('pastYearProblems.selectProblem')}
            </div>
          ) : (
            <div className="bg-bg-panel border border-border-default rounded-xl shadow-sm overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#fbefe9] text-primary">
                    {selectedProblem.exam_type}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#f0f0f0] text-text-muted">
                    {selectedProblem.year}
                  </span>
                  {selectedProblem.paper && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#e6f3eb] text-[#2B7A4B]">
                      {selectedProblem.paper}
                    </span>
                  )}
                  {selectedProblem.subject && (
                    <span className="text-[11px] text-text-muted">{selectedProblem.subject}</span>
                  )}
                  {selectedProblem.topic && (
                    <span className="text-[11px] text-text-muted">· {selectedProblem.topic}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleBookmark(selectedProblem.id)}
                    title={bookmarks.has(selectedProblem.id) ? 'Remove bookmark' : 'Bookmark'}
                    className={`p-1.5 rounded-md transition cursor-pointer ${
                      bookmarks.has(selectedProblem.id)
                        ? 'text-primary bg-primary/10'
                        : 'text-text-muted hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    {bookmarks.has(selectedProblem.id)
                      ? <BookmarkCheck size={18} />
                      : <Bookmark size={18} />}
                  </button>
                  <button
                    onClick={postToCommunity}
                    title="Discuss in community"
                    className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition cursor-pointer"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>

              {/* Question text */}
              <div className="px-6 py-5">
                <p className="font-medium text-[15px] text-text-primary leading-[1.7] mb-5">
                  {selectedProblem.question_text}
                </p>

                {/* Meta chips */}
                {(selectedProblem.marks || selectedProblem.word_limit || selectedProblem.question_number) && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {selectedProblem.question_number && (
                      <span className="text-[11px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded">
                        {selectedProblem.question_number}
                      </span>
                    )}
                    {selectedProblem.marks && (
                      <span className="text-[11px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded">
                        {selectedProblem.marks} marks
                      </span>
                    )}
                    {selectedProblem.word_limit && (
                      <span className="text-[11px] text-text-muted bg-bg-surface border border-border-default px-2 py-0.5 rounded">
                        ~{selectedProblem.word_limit} words
                      </span>
                    )}
                  </div>
                )}

                {/* Divider + section heading */}
                <div className="border-t border-border-default pt-5 mb-4">
                  <div className="text-[10px] font-bold tracking-[2px] uppercase text-text-muted mb-3">
                    {isMCQ ? 'Select the correct option' : 'Write your answer'}
                  </div>

                  {/* Interactive area */}
                  {isMCQ ? (
                    <MCQPanel
                      problem={selectedProblem}
                      attempt={attempts[selectedProblem.id] ?? null}
                      onAttempt={val => setAttempt(selectedProblem.id, val)}
                    />
                  ) : (
                    <MainsPanel
                      problem={selectedProblem}
                      attempt={attempts[selectedProblem.id] ?? null}
                      onAttempt={val => setAttempt(selectedProblem.id, val)}
                    />
                  )}
                </div>

                {/* Explanation — always shown for Mains; shown after reveal for MCQ */}
                {selectedProblem.explanation && (!isMCQ || attempts[selectedProblem.id]?.revealed) && (
                  <div className="mt-5 bg-[#FDF9F5] border border-[#EED4C3] rounded-lg p-4">
                    <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#9C4528] mb-2 flex items-center gap-1.5">
                      <FileText size={12} />
                      {t('pastYearProblems.explanation')}
                    </div>
                    <p className="text-[13px] text-[#9C4528] leading-relaxed">{selectedProblem.explanation}</p>
                  </div>
                )}

                {/* Footer: prev/next + community */}
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-border-default">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                      disabled={selectedIdx === 0}
                      className="flex items-center gap-1.5 border border-border-default text-text-muted py-2 px-3 rounded-lg text-[12px] hover:bg-bg-panel-hover transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                      onClick={() => setSelectedIdx(i => Math.min(problems.length - 1, i + 1))}
                      disabled={selectedIdx >= problems.length - 1}
                      className="flex items-center gap-1.5 border border-border-default text-text-muted py-2 px-3 rounded-lg text-[12px] hover:bg-bg-panel-hover transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                    <span className="self-center text-[11px] text-text-muted ml-1">
                      {selectedIdx + 1} / {problems.length}
                    </span>
                  </div>

                  <button
                    onClick={postToCommunity}
                    className="flex items-center gap-2 text-[12px] text-text-muted border border-border-default py-2 px-3 rounded-lg hover:bg-bg-panel-hover hover:text-primary transition cursor-pointer"
                  >
                    <MessageCircle size={14} /> Ask in Community
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PastYearProblems;
