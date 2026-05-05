import axios from 'axios';
import { clearAuthTokens, getAccessToken, getRefreshToken, refreshAccessToken } from '../utils/authTokens';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const requestUrl = originalRequest?.url as string | undefined;
    const isAuthEndpoint = requestUrl?.includes('/auth/login')
      || requestUrl?.includes('/auth/register')
      || requestUrl?.includes('/auth/refresh');

    if (
      error.response?.status === 401
      && !originalRequest?._retry
      && !isAuthEndpoint
      && getRefreshToken()
    ) {
      originalRequest._retry = true;
      const nextAccessToken = await refreshAccessToken(API_URL);

      if (nextAccessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      clearAuthTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { login: string; password: string; code?: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  requestVerificationEmail: (email: string) => api.post('/auth/resend-verification-request', { email }),
  resendVerification: () => api.post('/auth/resend-verification'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken?: string) =>
    api.post('/auth/logout', refreshToken ? { refreshToken } : {}),
  logoutAll: () => api.post('/auth/logout-all'),
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
  getNotificationPreferences: () => api.get('/users/notifications'),
  updateNotificationPreferences: (data: { 
    notificationsPush?: boolean; 
    notificationsEmail?: boolean; 
    notificationsSound?: boolean; 
    notificationsVibration?: boolean 
  }) => api.patch('/users/notifications', data),
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
  pinMessage: (chatId: string, messageId: string) =>
    api.patch(`/chats/${chatId}/pin`, { messageId }),
  unpinMessage: (chatId: string) =>
    api.delete(`/chats/${chatId}/pin`),
};

export const chatSettingsApi = {
  get: (chatId: string) => api.get(`/chat-settings/${chatId}`),
  update: (chatId: string, data: { isMuted?: boolean; isFavorite?: boolean; notificationLevel?: string; folderId?: string }) =>
    api.put(`/chat-settings/${chatId}`, data),
  mute: (chatId: string) => api.post(`/chat-settings/${chatId}/mute`),
  unmute: (chatId: string) => api.post(`/chat-settings/${chatId}/unmute`),
  updateNotificationLevel: (chatId: string, level: 'ALL' | 'MENTIONS' | 'MUTED') =>
    api.patch(`/chat-settings/${chatId}/notifications`, { level }),
  archive: (chatId: string) => api.post(`/chat-settings/${chatId}/archive`),
  unarchive: (chatId: string) => api.post(`/chat-settings/${chatId}/unarchive`),
  toggleFavorite: (chatId: string) => api.post(`/chat-settings/${chatId}/favorite`),
};

export const messageApi = {
  getMessages: (chatId: string, before?: string) =>
    api.get(`/messages/${chatId}${before ? `?before=${before}` : ''}`),
  send: (chatId: string, data: FormData) =>
    api.post(`/messages/${chatId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  forward: (messageId: string, chatIds: string[]) =>
    api.post(`/messages/${messageId}/forward`, { chatIds }),
  markAsRead: (messageId: string) =>
    api.post(`/messages/${messageId}/read`),
  edit: (messageId: string, content: string) =>
    api.patch(`/messages/${messageId}`, { content }),
  delete: (messageId: string) => api.delete(`/messages/${messageId}`),
};

export const searchApi = {
  searchMessages: (query: string, chatId?: string) =>
    api.get('/search/messages', { params: { query, chatId } }),
  searchByHashtag: (hashtag: string) =>
    api.get(`/search/hashtag/${hashtag}`),
  searchByMention: (username: string) =>
    api.get(`/search/mention/${username}`),
};

export const reactionApi = {
  add: (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/reactions`, { emoji }),
  remove: (messageId: string, emoji: string) =>
    api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
  getReactions: (messageId: string) =>
    api.get(`/messages/${messageId}/reactions`),
};

export const n8nApi = {
  getConfig: () => api.get('/n8n/config'),
  saveConfig: (data: any) => api.post('/n8n/config', data),
  getWebhooks: () => api.get('/n8n/webhooks'),
  createWebhook: (data: any) => api.post('/n8n/webhooks', data),
  updateWebhook: (id: string, data: any) => api.put(`/n8n/webhooks/${id}`, data),
  deleteWebhook: (id: string) => api.delete(`/n8n/webhooks/${id}`),
  testWebhook: (data: any) => api.post('/n8n/test', data),
  getWorkflows: () => api.get('/n8n/workflows'),
  triggerWorkflow: (workflowId: string, data?: any) => api.post(`/n8n/trigger/${workflowId}`, data),
};

export const telegramBotApi = {
  getConfig: () => api.get('/telegram-bot/config'),
  saveConfig: (data: any) => api.post('/telegram-bot/config', data),
  getStats: () => api.get('/telegram-bot/stats'),
  sendMessage: (data: { telegramUserId: string; content: string }) => 
    api.post('/telegram-bot/send', data),
  broadcast: (message: string) => api.post('/telegram-bot/broadcast', { message }),
  getUsers: () => api.get('/telegram-bot/users'),
  authorizeUser: (data: { telegramId: string; stogramUserId: string }) => 
    api.post('/telegram-bot/authorize', data),
  testConnection: (botToken: string) => 
    api.post('/telegram-bot/test-connection', { botToken }),
};

export const botEnhancedApi = {
  createCallbackQuery: (data: { botId: string; messageId: string; callbackData: string }) =>
    api.post('/bots/enhanced/callback-query', data),
  createInlineQuery: (data: { botId: string; query: string; offset?: string }) =>
    api.post('/bots/enhanced/inline-query', data),
};

export const botApi = {
  getAll: () => api.get('/bots'),
  getById: (botId: string) => api.get(`/bots/${botId}`),
  create: (data: { username: string; displayName: string; description?: string; isInline?: boolean }) =>
    api.post('/bots', data),
  update: (botId: string, data: { displayName?: string; description?: string; avatar?: string; isActive?: boolean; webhookUrl?: string | null }) =>
    api.patch(`/bots/${botId}`, data),
  remove: (botId: string) => api.delete(`/bots/${botId}`),
  regenerateToken: (botId: string) => api.post(`/bots/${botId}/regenerate-token`),
  addCommand: (botId: string, data: { command: string; description: string }) =>
    api.post(`/bots/${botId}/commands`, data),
  deleteCommand: (commandId: string) => api.delete(`/bots/commands/${commandId}`),
  getInstallations: (botId: string) => api.get(`/bots/${botId}/installations`),
  installToChat: (botId: string, chatId: string) => api.post(`/bots/${botId}/installations`, { chatId }),
  uninstallFromChat: (botId: string, chatId: string) => api.delete(`/bots/${botId}/installations/${chatId}`),
};

export const webhookApi = {
  create: (data: { botId: string; url: string; events: string[]; secret?: string }) => api.post('/webhooks', data),
  getByBot: (botId: string) => api.get(`/webhooks/bot/${botId}`),
  update: (webhookId: string, data: { url?: string; events?: string[]; isActive?: boolean; secret?: string }) =>
    api.patch(`/webhooks/${webhookId}`, data),
  remove: (webhookId: string) => api.delete(`/webhooks/${webhookId}`),
  getDeliveries: (webhookId: string, limit = 30) => api.get(`/webhooks/${webhookId}/deliveries?limit=${limit}`),
  getBotDeliveries: (botId: string, limit = 30) => api.get(`/webhooks/bot/${botId}/deliveries?limit=${limit}`),
  test: (webhookId: string) => api.post(`/webhooks/${webhookId}/test`),
  retryDelivery: (deliveryId: string) => api.post(`/webhooks/deliveries/${deliveryId}/retry`),
};

export default api;
