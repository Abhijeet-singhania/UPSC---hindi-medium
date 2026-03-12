import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Creates a new question. */
export const useCreateQuestion = (userId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { title: string; content: string; tags: string[]; is_anonymous: boolean }) =>
            api.createQuestion(userId, data),
        onSuccess: () => {
            // Refresh the questions list
            queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
        },
    });
};
