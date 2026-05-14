import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// ─── Async thunks ─────────────────────────────────────────────────────────────

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      if (!token) return rejectWithValue('No token');

      const response = await fetch(`${API_BASE}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return rejectWithValue(err.detail || 'Failed to fetch profile');
      }

      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.detail || 'Login failed. Please check your credentials.');
      }

      const data = await response.json(); // { access_token, token_type }

      // Hydrate full profile after token is in state
      dispatch(fetchProfile());

      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error occurred');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.detail || 'Registration failed. Please try again.');
      }

      return dispatch(loginUser({ email: userData.email, password: userData.password })).unwrap();
    } catch (err) {
      return rejectWithValue(err.message || 'Network error occurred');
    }
  }
);

// ─── Initial state (rehydrate from localStorage) ──────────────────────────────

const getInitialState = () => {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      // mock token has no expiry — allow it only in dev
      if (token === 'mock_jwt_token') {
        if (import.meta.env.DEV) {
          return {
            isAuthenticated: true,
            user: { email: 'mockuser@example.com' },
            token,
            loading: false,
            error: null,
          };
        } else {
          localStorage.removeItem('access_token');
        }
      } else {
        const decoded = jwtDecode(token);
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          return {
            isAuthenticated: true,
            user: { email: decoded.sub || '' },
            token,
            loading: false,
            error: null,
          };
        } else {
          localStorage.removeItem('access_token');
        }
      }
    }
  } catch (err) {
    console.warn('Failed to decode token from storage', err);
    localStorage.removeItem('access_token');
  }

  return {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,
  };
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('access_token');
    },
    clearError: (state) => {
      state.error = null;
    },
    // Dev-only bypass — guarded at UI level in Auth.jsx too
    mockLogin: (state) => {
      if (!import.meta.env.DEV) return;
      state.isAuthenticated = true;
      state.user = { email: 'mockuser@example.com', name: 'Mock User', role: 'user', reputation: 0 };
      state.token = 'mock_jwt_token';
      state.error = null;
      localStorage.setItem('access_token', 'mock_jwt_token');
    },
  },
  extraReducers: (builder) => {
    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;

        const token = action.payload.access_token;
        state.token = token;
        localStorage.setItem('access_token', token);

        try {
          const decoded = jwtDecode(token);
          // Minimal user until fetchProfile resolves
          state.user = { email: decoded.sub };
        } catch (_) {
          state.user = null;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to authenticate';
      });

    // registerUser
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to register';
      });

    // fetchProfile — merge server user into state
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearError, mockLogin } = authSlice.actions;

export default authSlice.reducer;
