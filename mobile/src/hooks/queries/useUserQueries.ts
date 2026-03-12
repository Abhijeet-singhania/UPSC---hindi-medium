import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Fetches user profile. Stale time: 5 minutes. */
export const useUser = (userId: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.users.detail(userId),
        queryFn: () => api.getUser(userId),
        staleTime: 1000 * 60 * 5,
        ...options,
    });
};

/** Fetches user stats. Stale time: 1 minute. */
export const useUserStats = (userId: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.users.stats(userId),
        queryFn: () => api.getUserStats(userId),
        staleTime: 1000 * 60 * 1,
        ...options,
    });
};
