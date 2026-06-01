import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PenLine, ThumbsUp, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const AnswerWriting = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [expandedAnswerId, setExpandedAnswerId] = useState(null);
  const textareaRef = useRef(null);
  const prevTodayIdRef = useRef(null);

  const {
    data: todayQuestion,
    isLoading: loadingToday,
    error: todayError,
    execute: fetchToday,
  } = useApi(`${API_BASE}/api/v1/daily/questions/today`);

  const {
    data: pastQuestions,
    isLoading: loadingPast,
    execute: fetchPast,
  } = useApi(`${API_BASE}/api/v1/daily/questions/`);

  const {
    data: answers,
    isLoading: loadingAnswers,
    execute: fetchAnswers,
  } = useApi(`${API_BASE}/api/v1/daily/questions/:questionId/answers`);

  const { execute: submitAnswer, isLoading: submitting } = useApi(
    `${API_BASE}/api/v1/daily/answers/`
  );

  const { execute: voteAnswer } = useApi(
    `${API_BASE}/api/v1/daily/answers/:answerId/vote`
  );

  const refreshToday = useCallback(() => {
    fetchToday().catch(() => {});
    fetchPast({ queryParams: { limit: 10 } }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshToday();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch on window focus so rotation is visible without a full reload
  useEffect(() => {
    const onFocus = () => refreshToday();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshToday]);

  // When todayQuestion changes (rotation), update selectedQuestion + clear stale answer
  useEffect(() => {
    if (!todayQuestion) return;
    if (todayQuestion.id !== prevTodayIdRef.current) {
      prevTodayIdRef.current = todayQuestion.id;
      setSelectedQuestion(todayQuestion);
      setAnswerText('');
      setSubmitSuccess(false);
      setSubmitError('');
    }
  }, [todayQuestion]);

  useEffect(() => {
    if (selectedQuestion) {
      fetchAnswers({ pathParams: { questionId: selectedQuestion.id } }).catch(() => {});
    }
  }, [selectedQuestion]);

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const wordLimit = selectedQuestion?.word_limit || 250;

  const handleSubmit = async () => {
    if (!answerText.trim() || !selectedQuestion) return;
    setSubmitError('');
    setSubmitSuccess(false);
    try {
      await submitAnswer({
        method: 'POST',
        body: { daily_question_id: selectedQuestion.id, content: answerText.trim() },
      });
      setSubmittedIds(prev => new Set([...prev, selectedQuestion.id]));
      setSubmitSuccess(true);
      setAnswerText('');
      fetchAnswers({ pathParams: { questionId: selectedQuestion.id } }).catch(() => {});
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    }
  };

  const handleVote = async (answerId) => {
    try {
      await voteAnswer({ pathParams: { answerId }, queryParams: { value: 1 }, method: 'POST' });
      fetchAnswers({ pathParams: { questionId: selectedQuestion.id } }).catch(() => {});
    } catch (_) {}
  };

  const alreadySubmitted = selectedQuestion && submittedIds.has(selectedQuestion.id);

  return (
    <div className="flex flex-col gap-6 max-w-[1100px] w-full mx-auto">
      {/* Header */}
      <div>
        <div className="text-[11px] tracking-[2px] text-primary font-bold mb-2 uppercase">Daily Practice</div>
        <h1 className="text-3xl font-serif text-text-primary mb-1">Answer Writing</h1>
        <p className="text-text-secondary text-[14px]">
          Write structured answers to UPSC-style questions and learn from peer responses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left: Question List */}
        <aside className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-widest text-text-secondary font-bold uppercase">Questions</div>
            <button
              onClick={refreshToday}
              disabled={loadingToday}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition cursor-pointer bg-transparent border-none p-0"
            >
              <RefreshCw size={12} className={loadingToday ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {loadingToday && (
            <div className="flex items-center gap-2 text-text-muted text-sm py-2">
              <Loader2 size={14} className="animate-spin" /> Loading today's question...
            </div>
          )}

          {todayError && !loadingToday && (
            <div className="bg-bg-panel border border-border-default rounded-xl p-4 text-text-muted text-sm">
              No active question today.
            </div>
          )}

          {todayQuestion && (
            <div
              onClick={() => { setSelectedQuestion(todayQuestion); setSubmitSuccess(false); setSubmitError(''); }}
              className={`bg-bg-panel border rounded-xl p-4 cursor-pointer transition-all ${
                selectedQuestion?.id === todayQuestion.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border-default hover:bg-bg-panel-hover'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold tracking-wider text-primary uppercase">Today</span>
                {selectedQuestion?.id === todayQuestion.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <p className="text-[13px] font-medium text-text-primary leading-relaxed line-clamp-2">
                {todayQuestion.title}
              </p>
              <div className="text-[11px] text-text-muted mt-2">
                {todayQuestion.subject && <span>{todayQuestion.subject} · </span>}
                {todayQuestion.marks && <span>{todayQuestion.marks} marks · </span>}
                {todayQuestion.word_limit && <span>{todayQuestion.word_limit} words</span>}
              </div>
            </div>
          )}

          {Array.isArray(pastQuestions) && pastQuestions.length > 1 && (
            <>
              <div className="text-[10px] tracking-widest text-text-secondary font-bold uppercase mt-3 mb-1">Previous</div>
              {pastQuestions
                .filter(q => q.id !== todayQuestion?.id)
                .slice(0, 8)
                .map(q => (
                  <div
                    key={q.id}
                    onClick={() => { setSelectedQuestion(q); setSubmitSuccess(false); setSubmitError(''); }}
                    className={`bg-bg-panel border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedQuestion?.id === q.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border-default hover:bg-bg-panel-hover'
                    }`}
                  >
                    <p className="text-[13px] text-text-primary leading-relaxed line-clamp-2">{q.title}</p>
                    <div className="text-[11px] text-text-muted mt-1 flex items-center gap-2">
                      {q.is_active && <span className="text-emerald-600 font-semibold">● Active</span>}
                      {q.submission_count ?? 0} submissions
                    </div>
                  </div>
                ))}
            </>
          )}
        </aside>

        {/* Right: Question Detail + Answer Composer + Answers */}
        <div className="flex flex-col gap-5">
          {!selectedQuestion && !loadingToday && (
            <div className="bg-bg-panel border border-border-default rounded-2xl p-10 text-center text-text-muted">
              Select a question from the left to begin writing.
            </div>
          )}

          {selectedQuestion && (
            <>
              {/* Question Card */}
              <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.subject && (
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-2 py-1 rounded">
                        {selectedQuestion.subject}
                      </span>
                    )}
                    {selectedQuestion.marks && (
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-bg-surface text-text-muted px-2 py-1 rounded border border-border-default">
                        {selectedQuestion.marks} marks
                      </span>
                    )}
                    {selectedQuestion.word_limit && (
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-bg-surface text-text-muted px-2 py-1 rounded border border-border-default">
                        ~{selectedQuestion.word_limit} words
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-serif text-[20px] font-medium text-text-primary mb-3 leading-snug">
                  {selectedQuestion.title}
                </h3>
                {selectedQuestion.content && selectedQuestion.content !== selectedQuestion.title && (
                  <p className="text-[14px] text-text-secondary leading-relaxed">{selectedQuestion.content}</p>
                )}
                {selectedQuestion.model_answer && (
                  <details className="mt-4 border-t border-border-default pt-4">
                    <summary className="text-[13px] text-primary cursor-pointer select-none font-medium">
                      View model answer
                    </summary>
                    <div className="mt-3 text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {selectedQuestion.model_answer}
                    </div>
                  </details>
                )}
              </div>

              {/* Answer Composer */}
              {!alreadySubmitted ? (
                <div className="bg-bg-panel border border-border-default rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-serif text-[17px] font-medium text-text-primary flex items-center gap-2">
                      <PenLine size={18} className="text-primary" />
                      Write Your Answer
                    </h4>
                    <span className={`text-[12px] font-mono ${wordCount > wordLimit ? 'text-red-500' : 'text-text-muted'}`}>
                      {wordCount} / {wordLimit} words
                    </span>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    rows={10}
                    placeholder="Write a well-structured answer. Use headings, bullet points and examples where appropriate..."
                    className="w-full bg-bg-surface border border-border-default rounded-xl p-4 text-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition resize-y leading-relaxed"
                  />

                  {submitError && (
                    <div className="flex items-center gap-2 text-red-500 text-[13px] mt-2">
                      <AlertCircle size={14} /> {submitError}
                    </div>
                  )}

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !answerText.trim() || wordCount > wordLimit}
                      className="bg-primary hover:bg-primary-hover text-white py-2 px-6 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />}
                      {submitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-bg-panel border border-primary/30 rounded-2xl p-5 flex items-center gap-3 text-primary">
                  <CheckCircle2 size={20} />
                  <span className="text-[14px] font-medium">
                    {submitSuccess ? 'Answer submitted successfully!' : 'You have already submitted for this question.'}
                  </span>
                </div>
              )}

              {/* Community Answers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif text-[17px] font-medium text-text-primary">
                    Community Answers
                    {Array.isArray(answers) && (
                      <span className="ml-2 text-[13px] text-text-muted font-sans">({answers.length})</span>
                    )}
                  </h4>
                </div>

                {loadingAnswers && (
                  <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                    <Loader2 size={14} className="animate-spin" /> Loading answers...
                  </div>
                )}

                {Array.isArray(answers) && answers.length === 0 && !loadingAnswers && (
                  <div className="bg-bg-panel border border-border-default rounded-xl p-6 text-center text-text-muted text-[13px]">
                    No answers yet. Be the first to answer!
                  </div>
                )}

                {Array.isArray(answers) && answers.map(ans => (
                  <div key={ans.id} className="bg-bg-panel border border-border-default rounded-xl mb-3 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[12px] font-semibold shrink-0">
                            {(ans.author_name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-text-primary">
                              {ans.is_pinned && <span className="text-primary mr-1">★ Best</span>}
                              {ans.author_name || 'Aspirant'}
                            </div>
                            <div className="text-[11px] text-text-muted">
                              {ans.author_reputation ?? 0} rep · {ans.word_count} words
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleVote(ans.id)}
                          className="flex items-center gap-1 text-[12px] text-text-muted hover:text-primary transition cursor-pointer"
                        >
                          <ThumbsUp size={14} /> {ans.upvotes}
                        </button>
                      </div>

                      <div
                        className={`text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap ${
                          expandedAnswerId === ans.id ? '' : 'line-clamp-4'
                        }`}
                      >
                        {ans.content}
                      </div>

                      <button
                        onClick={() => setExpandedAnswerId(expandedAnswerId === ans.id ? null : ans.id)}
                        className="flex items-center gap-1 text-[12px] text-text-muted hover:text-text-primary transition cursor-pointer mt-2"
                      >
                        {expandedAnswerId === ans.id
                          ? <><ChevronUp size={14} /> Show less</>
                          : <><ChevronDown size={14} /> Read full answer</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerWriting;
