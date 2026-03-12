export const queryKeys = {
    // Users
    users: {
        all: ['users'] as const,
        detail: (id: number) => ['users', id] as const,
        stats: (id: number) => ['users', id, 'stats'] as const,
    },
    // Questions
    questions: {
        all: ['questions'] as const,
        list: (filters: { tag?: string; skip?: number; limit?: number }) =>
            ['questions', 'list', filters] as const,
        detail: (id: number) => ['questions', id] as const,
    },
    // Answers
    answers: {
        byQuestion: (questionId: number) => ['answers', questionId] as const,
    },
    // Silent Library
    silentLibrary: {
        activeUsers: ['silent-library', 'active'] as const,
        stats: (userId: number) => ['silent-library', 'stats', userId] as const,
    },
    // Daily
    daily: {
        today: ['daily', 'today'] as const,
        answers: (questionId: number, sortBy: string) =>
            ['daily', 'answers', questionId, sortBy] as const,
    },
    // Leaderboard
    leaderboard: {
        reputation: (limit: number) => ['leaderboard', 'reputation', limit] as const,
        study: (period: string, limit: number) => ['leaderboard', 'study', period, limit] as const,
        userRank: (userId: number) => ['leaderboard', 'user', userId] as const,
    },
};
