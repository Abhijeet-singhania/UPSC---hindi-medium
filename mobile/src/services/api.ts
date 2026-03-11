// API base URL - change to your server IP when testing on device
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.10:8000' // Your PC's IP (ensure firewall allows port 8000)
  : 'https://api.upschindi.com'; // Production

const API_VERSION = '/api/v1';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}${API_VERSION}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'API Error');
    }

    return response.json();
  }

  // Users
  async createOrGetUser(deviceId: string, name?: string) {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, name }),
    });
  }

  async getUser(userId: number) {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId: number, data: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserStats(userId: number) {
    return this.request(`/users/${userId}/stats`);
  }

  // Questions
  async getQuestions(skip = 0, limit = 20, tag?: string) {
    let url = `/questions/?skip=${skip}&limit=${limit}`;
    if (tag) url += `&tag=${tag}`;
    return this.request(url);
  }

  async getQuestion(questionId: number) {
    return this.request(`/questions/${questionId}`);
  }

  async createQuestion(userId: number, data: any) {
    return this.request(`/questions/?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async voteQuestion(questionId: number, userId: number, value: number) {
    return this.request(
      `/questions/${questionId}/vote?user_id=${userId}&value=${value}`,
      { method: 'POST' }
    );
  }

  // Answers
  async getAnswers(questionId: number) {
    return this.request(`/answers/question/${questionId}`);
  }

  async createAnswer(userId: number, data: any) {
    return this.request(`/answers/?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async voteAnswer(answerId: number, userId: number, value: number) {
    return this.request(
      `/answers/${answerId}/vote?user_id=${userId}&value=${value}`,
      { method: 'POST' }
    );
  }

  async acceptAnswer(answerId: number, userId: number) {
    return this.request(`/answers/${answerId}/accept?user_id=${userId}`, {
      method: 'POST',
    });
  }

  // Silent Library
  async joinLibrary(userId: number) {
    return this.request(`/silent-library/join?user_id=${userId}`, {
      method: 'POST',
    });
  }

  async leaveLibrary(userId: number) {
    return this.request(`/silent-library/leave?user_id=${userId}`, {
      method: 'POST',
    });
  }

  async getActiveUsers() {
    return this.request('/silent-library/active');
  }

  async getStudyStats(userId: number) {
    return this.request(`/silent-library/stats/${userId}`);
  }

  // Daily Questions
  async getDailyQuestionToday() {
    return this.request('/daily/questions/today');
  }

  async getDailyQuestionAnswers(questionId: number, sortBy = 'upvotes') {
    return this.request(`/daily/questions/${questionId}/answers?sort_by=${sortBy}`);
  }

  async submitDailyAnswer(userId: number, dailyQuestionId: number, content: string) {
    return this.request(`/daily/answers/?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify({ daily_question_id: dailyQuestionId, content }),
    });
  }

  // Leaderboard
  async getLeaderboard(type: 'reputation' | 'study', period?: 'daily' | 'weekly' | 'alltime', limit = 20) {
    let url = '/leaderboard/';
    if (type === 'reputation') {
      url += `reputation?limit=${limit}`;
    } else {
      url += `study/${period}?limit=${limit}`;
    }
    return this.request(url);
  }

  async getUserLeaderboardRank(userId: number) {
    return this.request(`/leaderboard/user/${userId}`);
  }
}

export const api = new ApiService();
export default api;
