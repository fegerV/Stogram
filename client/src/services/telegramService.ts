import api from './api';

export const telegramService = {
  async getSettings() {
    const response = await api.get('/telegram/settings');
    return response.data;
  },

  async linkAccount(authData: any) {
    const response = await api.post('/telegram/link', authData);
    return response.data;
  },

  async unlinkAccount() {
    const response = await api.post('/telegram/unlink');
    return response.data;
  },

  async updateSettings(settings: {
    notifications: boolean;
    syncMessages: boolean;
    syncProfile: boolean;
  }) {
    const response = await api.put('/telegram/settings', settings);
    return response.data;
  },

  async createBridge(data: {
    stogramChatId: string;
    telegramChatId: string;
    telegramChatType?: string;
    syncDirection?: 'TELEGRAM_TO_STOGRAM' | 'STOGRAM_TO_TELEGRAM' | 'BIDIRECTIONAL';
  }) {
    const response = await api.post('/telegram/bridge', data);
    return response.data;
  },

  async deleteBridge(bridgeId: string) {
    const response = await api.delete(`/telegram/bridge/${bridgeId}`);
    return response.data;
  },

  async toggleBridge(bridgeId: string, isActive: boolean) {
    const response = await api.patch(`/telegram/bridge/${bridgeId}/toggle`, { isActive });
    return response.data;
  },

  async sendTestNotification() {
    const response = await api.post('/telegram/test-notification');
    return response.data;
  },

  initLoginWidget(containerId: string, botUsername: string, onAuth: (user: any) => void) {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    (window as any).onTelegramAuth = onAuth;
  },

  async authWithTelegram(authData: any) {
    const response = await api.post('/telegram/auth', authData);
    return response.data;
  },

  async initMiniApp(initData: string, initDataUnsafe: any) {
    const response = await api.post('/telegram/mini-app/auth', {
      initData,
      initDataUnsafe
    });
    return response.data;
  }
};
