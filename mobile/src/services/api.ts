import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@utils/config';
import { AuthTokens } from '@types/index';

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      async config => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            await this.clearAuth();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);

        return accessToken;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  private async clearAuth() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  async login(username: string, password: string): Promise<AuthTokens & { user: any }> {
    const response = await this.api.post('/auth/login', { username, password });
    return response.data;
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }): Promise<AuthTokens & { user: any }> {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async getMe() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async getChats() {
    const response = await this.api.get('/chats');
    return response.data;
  }

  async getMessages(chatId: string, page = 1, limit = 50) {
    const response = await this.api.get(`/messages/${chatId}`, {
      params: { page, limit },
    });
    return response.data;
  }

  async sendMessage(chatId: string, data: any) {
    const response = await this.api.post('/messages', { ...data, chatId });
    return response.data;
  }

  async editMessage(messageId: string, content: string) {
    const response = await this.api.patch(`/messages/${messageId}`, { content });
    return response.data;
  }

  async deleteMessage(messageId: string) {
    const response = await this.api.delete(`/messages/${messageId}`);
    return response.data;
  }

  async uploadFile(formData: FormData) {
    const response = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.api.patch('/users/profile', data);
    return response.data;
  }

  async searchMessages(query: string, chatId?: string) {
    const response = await this.api.get('/search/messages', {
      params: { query, chatId },
    });
    return response.data;
  }

  async getChatSettings(chatId: string) {
    const response = await this.api.get(`/chat-settings/${chatId}`);
    return response.data;
  }

  async muteChat(chatId: string) {
    const response = await this.api.post(`/chat-settings/${chatId}/mute`);
    return response.data;
  }

  async unmuteChat(chatId: string) {
    const response = await this.api.post(`/chat-settings/${chatId}/unmute`);
    return response.data;
  }

  async toggleFavorite(chatId: string) {
    const response = await this.api.post(`/chat-settings/${chatId}/favorite`);
    return response.data;
  }

  async getFolders() {
    const response = await this.api.get('/folders');
    return response.data;
  }

  async createFolder(data: { name: string; color?: string; icon?: string }) {
    const response = await this.api.post('/folders', data);
    return response.data;
  }

  async blockUser(userId: string) {
    const response = await this.api.post(`/block/${userId}`);
    return response.data;
  }

  async unblockUser(userId: string) {
    const response = await this.api.delete(`/block/${userId}`);
    return response.data;
  }

  async getBlockedUsers() {
    const response = await this.api.get('/block');
    return response.data;
  }

  getApiInstance(): AxiosInstance {
    return this.api;
  }
}

export default new ApiService();
