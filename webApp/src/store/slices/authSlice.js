import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';
      const response = await fetch(`${baseUrl}api/v1/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials), // { email, password }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.detail || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      return data; // { access_token, token_type }
    } catch (err) {
      return rejectWithValue(err.message || 'Network error occurred');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';
      const response = await fetch(`${baseUrl}api/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData), // { name, email, password, bio, exam_stage, optional_subject }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.detail || 'Registration failed. Please try again.');
      }

      // Automatically log in the user after successful registration
      return dispatch(loginUser({ email: userData.email, password: userData.password })).unwrap();
    } catch (err) {
      return rejectWithValue(err.message || 'Network error occurred');
    }
  }
);

const getInitialState = () => {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded = jwtDecode(token);
      // Check for expiration
      if (decoded.exp && decoded.exp * 1000 > Date.now()) {
        return {
          isAuthenticated: true,
          user: { email: decoded.sub || '' }, // decode yields email as sub
          token: token,
          loading: false,
          error: null
        };
      } else {
        localStorage.removeItem('access_token'); // Expired
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
    error: null
  };
};

const initialState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
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
    }
  },
  extraReducers: (builder) => {
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
          state.user = { email: decoded.sub };
        } catch (err) {
          state.user = null;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to authenticate';
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        // State will be handled by loginUser.fulfilled since it's dispatched after success
        // But we can clear loading here just in case
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to register';
      });
  }
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
