import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Polls active library users every 15 seconds. */
export const useActiveUsers = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.silentLibrary.activeUsers,
        queryFn: () => api.getActiveUsers(),
        refetchInterval: 15000,
        ...options,
    });
};

/** Fetches study stats for a user. Stale time: 30 seconds. */
export const useStudyStats = (userId: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.silentLibrary.stats(userId),
        queryFn: () => api.getStudyStats(userId),
        staleTime: 1000 * 30, // 30 seconds
        ...options,
    });
};
