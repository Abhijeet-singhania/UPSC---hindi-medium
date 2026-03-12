import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Fetches today's daily question. Stale time: 10 minutes. */
export const useDailyQuestion = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.daily.today,
        queryFn: () => api.getDailyQuestionToday(),
        staleTime: 1000 * 60 * 10,
        ...options,
    });
};

/** Fetches answers for a daily question. Stale time: 1 minute. */
export const useDailyAnswers = (
    questionId: number,
    sortBy: string = 'upvotes',
    options?: { enabled?: boolean }
) => {
    return useQuery({
        queryKey: queryKeys.daily.answers(questionId, sortBy),
        queryFn: () => api.getDailyQuestionAnswers(questionId, sortBy),
        staleTime: 1000 * 60 * 1,
        ...options,
    });
};
