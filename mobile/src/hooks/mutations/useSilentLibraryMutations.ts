import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Joins the silent library with optimistic update. */
export const useJoinLibrary = (userId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.joinLibrary(userId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: queryKeys.silentLibrary.activeUsers });
            // We could optimistically add the user to the active users list here if we had full user details
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.silentLibrary.activeUsers });
        },
    });
};

/** Leaves the silent library with optimistic update. */
export const useLeaveLibrary = (userId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.leaveLibrary(userId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: queryKeys.silentLibrary.activeUsers });
            const previousUsers = queryClient.getQueryData<any[]>(queryKeys.silentLibrary.activeUsers);

            if (previousUsers) {
                queryClient.setQueryData<any[]>(
                    queryKeys.silentLibrary.activeUsers,
                    previousUsers.filter((u) => u.id !== userId)
                );
            }
            return { previousUsers };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(queryKeys.silentLibrary.activeUsers, context.previousUsers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.silentLibrary.activeUsers });
        },
    });
};
