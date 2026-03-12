import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Submits a daily answer. */
export const useSubmitDailyAnswer = (userId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ dailyQuestionId, content }: { dailyQuestionId: number; content: string }) =>
            api.submitDailyAnswer(userId, dailyQuestionId, content),
        onSuccess: (_data, variables) => {
            // Invalidate daily answers list for all sort variants
            queryClient.invalidateQueries({
                queryKey: ['daily', 'answers', variables.dailyQuestionId],
            });
        },
    });
};
