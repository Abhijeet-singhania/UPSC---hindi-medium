import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Creates an answer for a specific question. */
export const useCreateAnswer = (userId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { question_id: number; content: string }) => api.createAnswer(userId, data),
        onSuccess: (_data, variables) => {
            // Invalidate the answers list for that question to trigger a refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.answers.byQuestion(variables.question_id) });
            // Invalidate the question to update answer count
            queryClient.invalidateQueries({ queryKey: queryKeys.questions.detail(variables.question_id) });
        },
    });
};

/** Accepts an answer for a question. */
export const useAcceptAnswer = (userId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ answerId, questionId }: { answerId: number; questionId: number }) =>
            api.acceptAnswer(answerId, userId),
        onSuccess: (_data, variables) => {
            // Invalidate answers list and parent question
            queryClient.invalidateQueries({ queryKey: queryKeys.answers.byQuestion(variables.questionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.questions.detail(variables.questionId) });
        },
    });
};
