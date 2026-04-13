import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../services/api';
import { socketService } from '../services/socket';
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../utils/authTokens';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (login: string, password: string, code?: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<any>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getAccessToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (login: string, password: string, code?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ login, password, code });
      const { user, token, refreshToken } = response.data;

      if (!token || !refreshToken) {
        throw new Error('Authentication tokens are missing in login response');
      }

      setAuthTokens(token, refreshToken);
      set({ user, token, isAuthenticated: true, isLoading: false });
      socketService.connect(token);
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (email: string, username: string, password: string, displayName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register({ email, username, password, displayName });
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    const refreshToken = getRefreshToken();
    void authApi.logout(refreshToken || undefined).catch(() => {});
    clearAuthTokens();
    socketService.disconnect();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    // Prevent multiple simultaneous calls
    const state = useAuthStore.getState();
    if (state.isLoading) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.getMe();
      set({ user: response.data, token, isAuthenticated: true, isLoading: false });
      socketService.connect(token);
    } catch (error) {
      clearAuthTokens();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  
  setUser: (user: User) => set({ user }),
}));
