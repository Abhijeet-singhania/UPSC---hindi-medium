import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';
import { Question, Answer } from '../../types';

/** Votes on a question with optimistic updates. */
export const useVoteQuestion = (userId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ questionId, value }: { questionId: number; value: number }) =>
            api.voteQuestion(questionId, userId, value),
        onMutate: async ({ questionId, value }) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: queryKeys.questions.detail(questionId) });

            // Snapshot the previous value
            const previousQuestion = queryClient.getQueryData<Question>(queryKeys.questions.detail(questionId));

            // Optimistically update to the new value
            if (previousQuestion) {
                queryClient.setQueryData<Question>(queryKeys.questions.detail(questionId), {
                    ...previousQuestion,
                    upvotes: previousQuestion.upvotes + (value === 1 ? 1 : 0),
                    downvotes: previousQuestion.downvotes + (value === -1 ? 1 : 0),
                });
            }

            // Return a context object with the snapshotted value
            return { previousQuestion };
        },
        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (_err, variables, context) => {
            if (context?.previousQuestion) {
                queryClient.setQueryData(
                    queryKeys.questions.detail(variables.questionId),
                    context.previousQuestion
                );
            }
        },
        // Always refetch after error or success:
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.questions.detail(variables.questionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
        },
    });
};

/** Votes on an answer with optimistic updates. */
export const useVoteAnswer = (userId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ answerId, questionId, value }: { answerId: number; questionId: number; value: number }) =>
            api.voteAnswer(answerId, userId, value),
        onMutate: async ({ answerId, questionId, value }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.answers.byQuestion(questionId) });
            const previousAnswers = queryClient.getQueryData<Answer[]>(queryKeys.answers.byQuestion(questionId));

            if (previousAnswers) {
                queryClient.setQueryData<Answer[]>(
                    queryKeys.answers.byQuestion(questionId),
                    previousAnswers.map((answer) =>
                        answer.id === answerId
                            ? {
                                ...answer,
                                upvotes: answer.upvotes + (value === 1 ? 1 : 0),
                                downvotes: answer.downvotes + (value === -1 ? 1 : 0),
                            }
                            : answer
                    )
                );
            }
            return { previousAnswers };
        },
        onError: (_err, variables, context) => {
            if (context?.previousAnswers) {
                queryClient.setQueryData(queryKeys.answers.byQuestion(variables.questionId), context.previousAnswers);
            }
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.answers.byQuestion(variables.questionId) });
        },
    });
};
