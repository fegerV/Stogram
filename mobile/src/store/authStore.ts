import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens } from '@types/index';
import apiService from '@services/api';
import socketService from '@services/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.login(username, password);
      await AsyncStorage.multiSet([
        ['accessToken', response.accessToken],
        ['refreshToken', response.refreshToken],
        ['user', JSON.stringify(response.user)],
      ]);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      await socketService.connect();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async data => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.register(data);
      await AsyncStorage.multiSet([
        ['accessToken', response.accessToken],
        ['refreshToken', response.refreshToken],
        ['user', JSON.stringify(response.user)],
      ]);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      await socketService.connect();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      socketService.disconnect();
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');

      if (userJson && token) {
        const user = JSON.parse(userJson);
        set({ user, isAuthenticated: true });
        await socketService.connect();
      }
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
