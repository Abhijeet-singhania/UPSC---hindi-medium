import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  MessageCircle, ThumbsUp, ThumbsDown, Plus, X,
  Loader2, AlertCircle, Send, Trophy
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { PageHeader, Badge, Reveal } from '../../components/ui';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const COMMON_TAGS = ['GS1', 'GS2', 'GS3', 'GS4', 'Polity', 'Economy', 'History', 'Geography', 'Environment', 'Ethics'];

const initials = (name) => String(name || 'U').substring(0, 2).toUpperCase();

const formatError = (err, fallback) => {
  const detail = err?.message ?? err;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || String(item)).join(', ');
  }
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return fallback;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const QuestionCard = ({ question, isSelected, userVote = 0, onSelect, onVote }) => (
  <div
    onClick={() => onSelect(question)}
    className={`bg-bg-panel border rounded-xl p-5 cursor-pointer transition-all ${
      isSelected ? 'border-primary bg-primary/5' : 'border-border-default hover:bg-bg-panel-hover'
    }`}
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <h4 className="font-medium text-text-primary text-[14px] leading-snug flex-1">{question.title}</h4>
      {question.is_solved && (
        <span className="text-[10px] font-bold tracking-wider uppercase bg-[#EBF5F0] text-[#2B7A4B] px-2 py-0.5 rounded shrink-0">
          Solved
        </span>
      )}
    </div>
    {question.tags && question.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {question.tags.map(tag => (
          <span key={tag} className="text-[10px] bg-bg-surface text-text-muted px-1.5 py-0.5 rounded border border-border-default">
            {tag}
          </span>
        ))}
      </div>
    )}
    <div className="flex items-center gap-4 text-[12px] text-text-muted">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onVote(question.id, userVote === 1 ? 0 : 1);
        }}
        title={userVote === 1 ? 'Remove upvote' : 'Upvote question'}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition cursor-pointer ${
          userVote === 1
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'hover:text-primary hover:bg-primary/5 border border-transparent'
        }`}
      >
        <ThumbsUp size={12} /> {question.upvotes}
      </button>
      <span className="flex items-center gap-1"><MessageCircle size={12} /> {question.answer_count} answers</span>
    </div>
  </div>
);

const AnswerCard = ({ answer, onVote, userVote = 0 }) => (
  <div className={`border rounded-xl p-5 bg-bg-panel transition-all ${answer.is_accepted ? 'border-[#2B7A4B]/50 bg-[#EBF5F0]/20' : 'border-border-default'}`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
          {initials(answer.author?.name)}
        </div>
        <div>
          <div className="text-[13px] font-medium text-text-primary flex items-center gap-1.5">
            {answer.is_accepted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#EBF5F0] text-[#2B7A4B] px-2 py-0.5 rounded">
                ✓ Accepted
              </span>
            )}
            {answer.author?.name || 'Aspirant'}
          </div>
          <div className="text-[11px] text-text-muted">{answer.author?.reputation ?? 0} reputation</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onVote(answer.id, userVote === 1 ? 0 : 1)}
          title={userVote === 1 ? 'Remove upvote' : 'Upvote'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer ${
            userVote === 1
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-text-muted hover:text-primary hover:bg-primary/5 border border-transparent'
          }`}
        >
          <ThumbsUp size={13} /> {answer.upvotes}
        </button>
        <button
          type="button"
          onClick={() => onVote(answer.id, userVote === -1 ? 0 : -1)}
          title={userVote === -1 ? 'Remove downvote' : 'Downvote'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer ${
            userVote === -1
              ? 'bg-red-50 text-red-500 border border-red-200'
              : 'text-text-muted hover:text-red-400 hover:bg-red-50/50 border border-transparent'
          }`}
        >
          <ThumbsDown size={13} /> {answer.downvotes}
        </button>
      </div>
    </div>
    <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{answer.content}</p>
  </div>
);

// ─── Ask Question Modal ───────────────────────────────────────────────────────

const AskModal = ({ onClose, onSubmit, submitting }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a title.'); return; }
    setError('');
    try {
      await onSubmit({ title, content, tags: selectedTags, is_anonymous: isAnonymous });
    } catch (err) {
      setError(formatError(err, 'Failed to post question.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-bg-panel border border-border-default rounded-2xl w-full max-w-[600px] shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h3 className="font-serif text-[20px] font-medium text-text-primary">Ask a Question</h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Question title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What is the difference between a Money Bill and a Finance Bill?"
              className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary transition text-[14px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Details (optional)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              placeholder="Add context, what you've already tried, or specific doubts..."
              className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition resize-none text-[13px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-[12px] px-3 py-1 rounded-full border transition cursor-pointer ${
                    selectedTags.includes(tag)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-bg-surface border-border-default text-text-secondary hover:border-text-muted'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="anon"
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="anon" className="text-sm text-text-secondary cursor-pointer">
              Post anonymously
            </label>
          </div>
          {error && <p className="text-red-500 text-[13px]">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-bg-panel-hover transition cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Community = () => {
  const { t } = useTranslation();
  const { user, token } = useSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState('feed');
  const [activeTag, setActiveTag] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [voteError, setVoteError] = useState('');
  const [userVotes, setUserVotes] = useState({});
  const [questionVotes, setQuestionVotes] = useState({});
  const [localAnswers, setLocalAnswers] = useState([]);
  const [localQuestions, setLocalQuestions] = useState([]);

  const { data: questionsData, isLoading: loadingQuestions, error: questionsError, execute: loadQuestions } =
    useApi(`${API_BASE}/api/v1/questions/`);

  const { data: answersData, isLoading: loadingAnswers, execute: loadAnswers } =
    useApi(`${API_BASE}/api/v1/answers/question/:questionId`);

  const { execute: postQuestion, isLoading: postingQuestion } =
    useApi(`${API_BASE}/api/v1/questions/`);

  const { execute: postAnswer, isLoading: postingAnswer } =
    useApi(`${API_BASE}/api/v1/answers/`);

  const { data: leaderboardData, execute: loadLeaderboard } =
    useApi(`${API_BASE}/api/v1/leaderboard/reputation`);

  const { execute: acceptAnswerCall } =
    useApi(`${API_BASE}/api/v1/answers/:answerId/accept`);

  const fetchQuestions = useCallback(() => {
    loadQuestions({ queryParams: { tag: activeTag || undefined, limit: 20 } }).catch(() => {});
  }, [activeTag, loadQuestions]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
  useEffect(() => { loadLeaderboard({ queryParams: { limit: 5 } }).catch(() => {}); }, [loadLeaderboard]);
  useEffect(() => {
    if (selectedQuestion) {
      loadAnswers({ pathParams: { questionId: selectedQuestion.id } }).catch(() => {});
    } else {
      setLocalAnswers([]);
      setUserVotes({});
    }
  }, [selectedQuestion, loadAnswers]);

  const handlePostQuestion = async (data) => {
    await postQuestion({ method: 'POST', body: data });
    setShowAskModal(false);
    fetchQuestions();
  };

  const handlePostAnswer = async () => {
    if (!answerText.trim() || !selectedQuestion) return;
    if (!token) {
      setAnswerError('Please log in to post an answer.');
      return;
    }

    const questionId = selectedQuestion.id;
    setAnswerError('');

    try {
      await postAnswer({
        method: 'POST',
        body: { question_id: questionId, content: answerText.trim() },
      });
      setAnswerText('');
      await loadAnswers({ pathParams: { questionId } });
      fetchQuestions();
    } catch (err) {
      setAnswerError(formatError(err, 'Failed to post answer.'));
    }
  };

  const handleVote = async (answerId, newValue) => {
    if (!token) {
      setVoteError('Please log in to vote on answers.');
      return;
    }
    if (!selectedQuestion) return;

    setVoteError('');
    const currentVote = userVotes[answerId] ?? 0;

    setUserVotes(prev => ({ ...prev, [answerId]: newValue }));
    setLocalAnswers(prev => prev.map(a => {
      if (a.id !== answerId) return a;
      let { upvotes, downvotes } = a;
      if (currentVote === 1) upvotes = Math.max(0, upvotes - 1);
      if (currentVote === -1) downvotes = Math.max(0, downvotes - 1);
      if (newValue === 1) upvotes++;
      if (newValue === -1) downvotes++;
      return { ...a, upvotes, downvotes };
    }));

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/answers/${answerId}/vote?value=${newValue}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (typeof result.upvotes === 'number') {
        setLocalAnswers(prev => prev.map(a =>
          a.id === answerId
            ? { ...a, upvotes: result.upvotes, downvotes: result.downvotes, user_vote: result.user_vote ?? newValue }
            : a
        ));
      }
      if (typeof result.user_vote === 'number') {
        setUserVotes(prev => ({ ...prev, [answerId]: result.user_vote }));
      }
    } catch (_) {
      setUserVotes(prev => ({ ...prev, [answerId]: currentVote }));
      loadAnswers({ pathParams: { questionId: selectedQuestion.id } }).catch(() => {});
      setVoteError('Could not save your vote. Please try again.');
    }
  };

  const handleQuestionVote = async (questionId, newValue) => {
    if (!token) {
      setVoteError('Please log in to vote on questions.');
      return;
    }

    setVoteError('');
    const currentVote = questionVotes[questionId] ?? 0;

    setQuestionVotes(prev => ({ ...prev, [questionId]: newValue }));
    setLocalQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      let { upvotes, downvotes } = q;
      if (currentVote === 1) upvotes = Math.max(0, upvotes - 1);
      if (currentVote === -1) downvotes = Math.max(0, downvotes - 1);
      if (newValue === 1) upvotes++;
      if (newValue === -1) downvotes++;
      return { ...q, upvotes, downvotes };
    }));

    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(prev => {
        if (!prev || prev.id !== questionId) return prev;
        let { upvotes, downvotes } = prev;
        if (currentVote === 1) upvotes = Math.max(0, upvotes - 1);
        if (currentVote === -1) downvotes = Math.max(0, downvotes - 1);
        if (newValue === 1) upvotes++;
        if (newValue === -1) downvotes++;
        return { ...prev, upvotes, downvotes, user_vote: newValue };
      });
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/questions/${questionId}/vote?value=${newValue}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (typeof result.upvotes === 'number') {
        setLocalQuestions(prev => prev.map(q =>
          q.id === questionId
            ? { ...q, upvotes: result.upvotes, downvotes: result.downvotes, user_vote: result.user_vote ?? newValue }
            : q
        ));
      }
      if (typeof result.user_vote === 'number') {
        setQuestionVotes(prev => ({ ...prev, [questionId]: result.user_vote }));
      }
      if (selectedQuestion?.id === questionId && typeof result.upvotes === 'number') {
        setSelectedQuestion(prev => prev ? {
          ...prev,
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          user_vote: result.user_vote ?? newValue,
        } : prev);
      }
    } catch (_) {
      setQuestionVotes(prev => ({ ...prev, [questionId]: currentVote }));
      fetchQuestions();
      setVoteError('Could not save your vote. Please try again.');
    }
  };

  const handleAccept = async (answerId) => {
    if (!user) { setAcceptError('Please log in to accept an answer.'); return; }
    setAcceptError('');
    try {
      await acceptAnswerCall({ pathParams: { answerId }, method: 'POST' });
      loadAnswers({ pathParams: { questionId: selectedQuestion.id } }).catch(() => {});
      fetchQuestions();
    } catch (e) {
      setAcceptError(formatError(e, 'Could not accept answer. Only the question author can accept.'));
    }
  };

  useEffect(() => {
    if (!Array.isArray(answersData)) {
      setLocalAnswers([]);
      return;
    }
    setLocalAnswers(answersData);
    const votes = {};
    answersData.forEach((answer) => {
      if (answer.user_vote) votes[answer.id] = answer.user_vote;
    });
    setUserVotes(votes);
  }, [answersData]);

  useEffect(() => {
    if (!Array.isArray(questionsData)) {
      setLocalQuestions([]);
      return;
    }
    setLocalQuestions(questionsData);
    const votes = {};
    questionsData.forEach((question) => {
      if (question.user_vote) votes[question.id] = question.user_vote;
    });
    setQuestionVotes(votes);

    if (selectedQuestion) {
      const fresh = questionsData.find(q => q.id === selectedQuestion.id);
      if (fresh) {
        setSelectedQuestion(fresh);
      }
    }
  }, [questionsData]); // eslint-disable-line react-hooks/exhaustive-deps

  const questions = localQuestions;
  const answers = localAnswers;
  const leaderboard = leaderboardData?.leaderboard || [];

  return (
    <div className="flex flex-col">
      {showAskModal && (
        <AskModal
          onClose={() => setShowAskModal(false)}
          onSubmit={handlePostQuestion}
          submitting={postingQuestion}
        />
      )}

      <PageHeader
        title={t('community.title')}
        subtitle={t('community.subtitle')}
        action={
          <button
            type="button"
            onClick={() => setShowAskModal(true)}
            className="bg-primary hover:bg-primary-hover text-white border-none py-2 px-4 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
          <Plus size={15} /> Ask Question
          </button>
        }
      />

      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex gap-8 border-b border-border-default mb-6">
            {[
              { id: 'feed', label: t('community.tabFeed') },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer ${activeTab === tab.id ? 'text-primary' : 'text-text-muted'}`}
              >
                {tab.label}
                {activeTab === tab.id && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary" />}
              </button>
            ))}
          </div>

          {activeTab === 'feed' && (
            <>
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTag('')}
                  className={`border py-1.5 px-4 rounded-full text-[13px] cursor-pointer transition-colors ${
                    activeTag === '' ? 'bg-bg-surface-dark border-border-muted text-text-primary' : 'bg-bg-panel border-border-default text-text-muted hover:bg-bg-panel-hover'
                  }`}
                >
                  All
                </button>
                {COMMON_TAGS.slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                    className={`border py-1.5 px-4 rounded-full text-[13px] cursor-pointer transition-colors ${
                      activeTag === tag ? 'bg-primary/10 border-primary text-primary' : 'bg-bg-panel border-border-default text-text-muted hover:bg-bg-panel-hover'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {voteError && (
                <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
                  {voteError}
                </div>
              )}

              <div className="flex gap-5">
                <div className="w-[340px] shrink-0 flex flex-col gap-3">
                  {loadingQuestions && (
                    <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                      <Loader2 size={14} className="animate-spin" /> Loading questions...
                    </div>
                  )}
                  {questionsError && !loadingQuestions && (
                    <div className="flex items-center gap-2 text-red-500 text-sm py-4">
                      <AlertCircle size={14} /> Failed to load questions.
                    </div>
                  )}
                  {!loadingQuestions && questions.length === 0 && !questionsError && (
                    <div className="bg-bg-panel border border-border-default rounded-xl p-6 text-center">
                      <MessageCircle size={28} className="text-text-muted opacity-40 mx-auto mb-3" />
                      <p className="text-[14px] font-medium text-text-primary mb-1">No questions yet</p>
                      <p className="text-[12px] text-text-muted">Be the first to ask a question!</p>
                    </div>
                  )}
                  {questions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      isSelected={selectedQuestion?.id === q.id}
                      userVote={questionVotes[q.id] ?? q.user_vote ?? 0}
                      onSelect={qItem => { setSelectedQuestion(qItem); setAcceptError(''); setVoteError(''); }}
                      onVote={handleQuestionVote}
                    />
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  {!selectedQuestion ? (
                    <div className="bg-bg-panel border border-border-default rounded-xl p-8 text-center text-text-muted text-[13px]">
                      Select a question to view and answer.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="bg-bg-panel border border-border-default rounded-xl p-6">
                        <h3 className="font-serif text-[20px] font-medium text-text-primary mb-3 leading-snug">
                          {selectedQuestion.title}
                        </h3>
                        {selectedQuestion.content && selectedQuestion.content !== selectedQuestion.title && (
                          <p className="text-[14px] text-text-secondary leading-relaxed mb-4">{selectedQuestion.content}</p>
                        )}
                        {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedQuestion.tags.map(tag => (
                              <span key={tag} className="text-[10px] bg-bg-surface text-text-muted px-2 py-0.5 rounded border border-border-default">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-bg-panel border border-border-default rounded-xl p-5">
                        <h4 className="font-medium text-[14px] text-text-primary mb-3">Your Answer</h4>
                        <textarea
                          value={answerText}
                          onChange={e => setAnswerText(e.target.value.slice(0, 2000))}
                          rows={4}
                          maxLength={2000}
                          placeholder="Write a clear, structured answer..."
                          className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-[13px] text-text-primary focus:outline-none focus:border-primary transition resize-none"
                        />
                        <div className={`text-[11px] text-right mt-1 font-mono ${answerText.length >= 1900 ? 'text-red-500' : 'text-text-muted'}`}>
                          {answerText.length} / 2000
                        </div>
                        {answerError && <p className="text-red-500 text-[12px] mt-2">{answerError}</p>}
                        <div className="flex justify-end mt-3">
                          <button
                            type="button"
                            onClick={handlePostAnswer}
                            disabled={postingAnswer || !answerText.trim()}
                            className="bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg text-[13px] font-medium flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
                          >
                            {postingAnswer ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                            {postingAnswer ? 'Posting...' : 'Post Answer'}
                          </button>
                        </div>
                      </div>

                      <div>
                        {acceptError && (
                          <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
                            {acceptError}
                          </div>
                        )}
                        <div className="text-[12px] text-text-muted mb-3 font-semibold uppercase tracking-wider">
                          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                        </div>
                        {loadingAnswers && (
                          <div className="flex items-center gap-2 text-text-muted text-sm">
                            <Loader2 size={14} className="animate-spin" /> Loading answers...
                          </div>
                        )}
                        <div className="flex flex-col gap-3">
                          {answers.map(ans => (
                            <div key={ans.id}>
                              <AnswerCard
                                answer={ans}
                                onVote={handleVote}
                                userVote={userVotes[ans.id] ?? ans.user_vote ?? 0}
                              />
                              {user?.id && selectedQuestion.user_id === user.id && !ans.is_accepted && (
                                <button
                                  type="button"
                                  onClick={() => handleAccept(ans.id)}
                                  className="text-[11px] text-text-muted hover:text-[#2B7A4B] mt-1 ml-1 cursor-pointer flex items-center gap-1 transition"
                                >
                                  ✓ Mark as accepted answer
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab !== 'feed' && (
            <div className="bg-bg-panel border border-border-default rounded-xl p-10 text-center text-text-muted text-[13px]">
              Coming soon in the next release.
            </div>
          )}
        </div>

        <div className="w-[280px] shrink-0 flex flex-col gap-6">
          <div>
            <h4 className="font-serif font-semibold text-[16px] mb-4 text-text-primary flex items-center gap-2">
              <Trophy size={16} className="text-primary" /> {t('community.ldrTitle')}
            </h4>
            <div className="bg-bg-panel border border-border-default rounded-xl p-4 shadow-sm">
              {leaderboard.length === 0 && (
                <p className="text-[12px] text-text-muted text-center py-2">No leaderboard data yet.</p>
              )}
              {leaderboard.map((entry, i) => (
                <div key={entry.user_id} className={`flex items-center gap-3 ${i > 0 ? 'border-t border-border-default mt-3 pt-3' : ''}`}>
                  <span className="text-text-muted text-xs w-6 shrink-0 font-medium">#{entry.rank}</span>
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {initials(entry.name)}
                  </div>
                  <span className="font-medium flex-1 text-sm text-text-primary truncate">{entry.name}</span>
                  <span className="text-xs text-primary font-bold">{entry.score} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/8 border border-primary/20 rounded-xl p-5">
            <div className="text-[10px] tracking-widest text-primary/70 font-bold uppercase mb-2">Community tip</div>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Earn reputation by giving helpful answers. Reach 200 points to become a Contributor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
