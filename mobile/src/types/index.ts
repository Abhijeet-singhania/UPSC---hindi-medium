export interface User {
    id: number;
    device_id: string;
    name: string | null;
    bio: string | null;
    exam_stage: 'beginner' | 'prelims' | 'mains' | 'interview';
    optional_subject: string | null;
    role: 'user' | 'admin' | 'moderator' | 'mentor';
    reputation: number;
    wallet_balance: number;
    created_at: string;
}

export interface Question {
    id: number;
    title: string;
    content: string;
    user_id: number;
    is_anonymous: boolean;
    is_solved: boolean;
    upvotes: number;
    downvotes: number;
    created_at: string;
    author: {
        id: number;
        name: string | null;
        reputation: number;
    } | null;
    tags: string[];
    answer_count: number;
}

export interface Answer {
    id: number;
    content: string;
    question_id: number;
    user_id: number;
    is_accepted: boolean;
    upvotes: number;
    downvotes: number;
    created_at: string;
}

export interface SilentSession {
    id: number;
    user_id: number;
    start_time: string;
    end_time: string | null;
    duration_minutes: number;
}

export interface StudyStats {
    total_minutes: number;
    total_hours: number;
    total_sessions: number;
    average_session_minutes: number;
}
