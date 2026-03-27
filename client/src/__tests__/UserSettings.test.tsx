import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserSettings from '../components/UserSettings';
import { monitoredApi } from '../utils/monitoredApi';
import { userApi } from '../services/api';

vi.mock('../utils/monitoredApi', () => ({
  monitoredApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/api', () => ({
  userApi: {
    updateProfile: vi.fn(),
  },
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    setUser: vi.fn(),
  }),
}));

vi.mock('../store/themeStore', () => ({
  useThemeStore: () => ({
    setTheme: vi.fn(),
  }),
}));

vi.mock('../utils/performance', () => ({
  usePerformanceMonitor: () => ({
    startRender: vi.fn(),
    trackInteraction: vi.fn(),
  }),
}));

vi.mock('../utils/pushNotifications', () => ({
  subscribeToPushNotifications: vi.fn(),
  unsubscribeFromPushNotifications: vi.fn(),
}));

vi.mock('../store/notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      setSoundEnabled: vi.fn(),
      setVibrationEnabled: vi.fn(),
    }),
  },
}));

vi.mock('../utils/notificationSound', () => ({
  notificationSound: {
    playMessageSound: vi.fn(),
  },
}));

vi.mock('../components/LazyComponents', () => ({
  LazyBotManager: () => <div>Bot manager</div>,
}));

const baseUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  bio: 'Test bio',
  status: 'ONLINE',
  avatar: null,
};

const basePrivacy = {
  showOnlineStatus: true,
  showProfilePhoto: true,
  showLastSeen: true,
};

const baseNotifications = {
  notificationsPush: true,
  notificationsEmail: true,
  notificationsSound: true,
  notificationsVibration: true,
};

const baseFolders = [
  {
    id: 'folder-1',
    name: 'Work',
    color: '#3390ec',
    order: 1,
    chatSettings: [{ chat: { id: 'chat-1', name: 'Project Chat', type: 'GROUP' } }],
  },
];

const mockDefaultGets = () => {
  (monitoredApi.get as any).mockImplementation((url: string) => {
    if (url === '/users/me') return Promise.resolve({ data: baseUser });
    if (url === '/users/privacy') return Promise.resolve({ data: basePrivacy });
    if (url === '/users/notifications') return Promise.resolve({ data: baseNotifications });
    if (url === '/security/status') {
      return Promise.resolve({
        data: {
          twoFactorEnabled: false,
          encryptionEnabled: false,
          trustedIPsCount: 0,
          isLocked: false,
        },
      });
    }
    if (url === '/folders') return Promise.resolve({ data: { folders: baseFolders } });
    return Promise.resolve({ data: {} });
  });
};

const clickMenuItem = async (label: string | RegExp) => {
  const button = await screen.findByRole('button', { name: label });
  fireEvent.click(button);
};

describe('UserSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockDefaultGets();
  });

  it('renders user summary data', async () => {
    render(<UserSettings onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
    });
  });

  it('loads security data when the security menu item is opened', async () => {
    render(<UserSettings onClose={() => {}} />);

    await clickMenuItem(/Безопасность/i);

    await waitFor(() => {
      expect(monitoredApi.get).toHaveBeenCalledWith('/security/status');
      expect(document.querySelectorAll('input[type="password"]')).toHaveLength(3);
    });
  });

  it('submits the change-password form', async () => {
    (monitoredApi.post as any).mockResolvedValue({ data: { success: true } });

    render(<UserSettings onClose={() => {}} />);

    await clickMenuItem(/Безопасность/i);

    await waitFor(() => {
      expect(document.querySelectorAll('input[type="password"]')).toHaveLength(3);
    });

    const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]')) as HTMLInputElement[];
    fireEvent.change(passwordInputs[0], { target: { value: 'oldpassword' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } });
    fireEvent.change(passwordInputs[2], { target: { value: 'newpassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /изменить пароль/i }));

    await waitFor(() => {
      expect(monitoredApi.post).toHaveBeenCalledWith('/users/change-password', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      });
    });
  });

  it('opens the chat settings screen with notification toggles', async () => {
    render(<UserSettings onClose={() => {}} />);

    await clickMenuItem(/Настройки чатов/i);

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });
  });

  it('loads folders from the folders menu entry', async () => {
    render(<UserSettings onClose={() => {}} />);

    await clickMenuItem(/Папки с чатами/i);

    await waitFor(() => {
      expect(monitoredApi.get).toHaveBeenCalledWith('/folders');
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Project Chat')).toBeInTheDocument();
    });
  });

  it('shows bot integrations tabs and the embedded bot manager', async () => {
    render(<UserSettings onClose={() => {}} />);

    await clickMenuItem(/Боты и интеграции/i);

    await waitFor(() => {
      expect(screen.getByText('Bot manager')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Telegram' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'n8n' })).toBeInTheDocument();
    });
  });

  it('saves the profile after an avatar file is selected', async () => {
    (userApi.updateProfile as any).mockResolvedValue({ data: baseUser });

    render(<UserSettings onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));
    });

    await waitFor(() => {
      expect(userApi.updateProfile).toHaveBeenCalled();
    });
  });

  it('switches settings language to english', async () => {
    render(<UserSettings onClose={() => {}} />);

    await clickMenuItem(/Язык/i);
    fireEvent.click(await screen.findByRole('button', { name: /English/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Settings panel interface language').length).toBeGreaterThan(0);
    });
  });
});
