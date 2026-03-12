import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Fetches a list of questions. Stale time: 2 minutes. */
export const useQuestions = (
    filters: { tag?: string; skip?: number; limit?: number } = {},
    options?: { enabled?: boolean }
) => {
    return useQuery({
        queryKey: queryKeys.questions.list(filters),
        queryFn: () => api.getQuestions(filters.skip, filters.limit, filters.tag),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
        ...options,
    });
};

/** Fetches a single question detail. */
export const useQuestion = (questionId: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.questions.detail(questionId),
        queryFn: () => api.getQuestion(questionId),
        ...options,
    });
};

/** Fetches answers for a specific question. Stale time: 1 minute. */
export const useAnswers = (questionId: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.answers.byQuestion(questionId),
        queryFn: () => api.getAnswers(questionId),
        staleTime: 1000 * 60 * 1,
        ...options,
    });
};
