import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { login: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
};

export const userApi = {
  search: (query: string) => api.get(`/users/search?query=${query}`),
  getById: (userId: string) => api.get(`/users/${userId}`),
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data: FormData) => api.patch('/users/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
  getContacts: () => api.get('/users/contacts'),
  addContact: (data: { contactId: string; nickname?: string }) =>
    api.post('/users/contacts', data),
  removeContact: (contactId: string) => api.delete(`/users/contacts/${contactId}`),
  subscribeToPush: (subscription: PushSubscription) =>
    api.post('/users/push-subscription', { subscription }),
  updateTheme: (theme: 'light' | 'dark') => api.patch('/users/theme', { theme }),
  getPrivacySettings: () => api.get('/users/privacy'),
  updatePrivacySettings: (data: { showOnlineStatus?: boolean; showProfilePhoto?: boolean; showLastSeen?: boolean }) =>
    api.patch('/users/privacy', data),
};

export const chatApi = {
  create: (data: { type: string; name?: string; description?: string; memberIds: string[] }) =>
    api.post('/chats', data),
  getAll: () => api.get('/chats'),
  getById: (chatId: string) => api.get(`/chats/${chatId}`),
  update: (chatId: string, data: { name?: string; description?: string; avatar?: string }) =>
    api.patch(`/chats/${chatId}`, data),
  delete: (chatId: string) => api.delete(`/chats/${chatId}`),
  addMember: (chatId: string, userId: string) =>
    api.post(`/chats/${chatId}/members`, { userId }),
  removeMember: (chatId: string, memberId: string) =>
    api.delete(`/chats/${chatId}/members/${memberId}`),
};

export const messageApi = {
  getMessages: (chatId: string, before?: string) =>
    api.get(`/messages/${chatId}${before ? `?before=${before}` : ''}`),
  send: (chatId: string, data: FormData) =>
    api.post(`/messages/${chatId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  edit: (messageId: string, content: string) =>
    api.patch(`/messages/${messageId}`, { content }),
  delete: (messageId: string) => api.delete(`/messages/${messageId}`),
};

export const reactionApi = {
  add: (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/reactions`, { emoji }),
  remove: (messageId: string, emoji: string) =>
    api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
  getReactions: (messageId: string) =>
    api.get(`/messages/${messageId}/reactions`),
};

export default api;
