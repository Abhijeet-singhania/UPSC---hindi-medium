import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../services/queryKeys';

/** Fetches the reputation leaderboard. Stale time: 5 minutes. */
export const useReputationLeaderboard = (limit: number = 20, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.leaderboard.reputation(limit),
        queryFn: () => api.getLeaderboard('reputation', undefined, limit),
        staleTime: 1000 * 60 * 5,
        ...options,
    });
};

/** Fetches the study leaderboard. Stale time: 5 minutes. */
export const useStudyLeaderboard = (
    period: 'daily' | 'weekly' | 'alltime',
    limit: number = 20,
    options?: { enabled?: boolean }
) => {
    return useQuery({
        queryKey: queryKeys.leaderboard.study(period, limit),
        queryFn: () => api.getLeaderboard('study', period, limit),
        staleTime: 1000 * 60 * 5,
        ...options,
    });
};

/** Fetches a user's leaderboard rank. Stale time: 2 minutes. */
export const useUserRank = (userId: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.leaderboard.userRank(userId),
        queryFn: () => api.getUserLeaderboardRank(userId),
        staleTime: 1000 * 60 * 2,
        ...options,
    });
};
