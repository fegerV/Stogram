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

describe('UserSettings - Security Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (monitoredApi.get as any).mockImplementation((url: string) => {
      if (url === '/users/me') {
        return Promise.resolve({ data: { id: '1', username: 'testuser', displayName: 'Test User' } });
      }
      if (url === '/users/privacy') {
        return Promise.resolve({ data: { showOnlineStatus: true, showProfilePhoto: true, showLastSeen: true } });
      }
      if (url === '/users/notifications') {
        return Promise.resolve({ 
          data: { 
            notificationsPush: true, 
            notificationsEmail: true, 
            notificationsSound: true, 
            notificationsVibration: true 
          } 
        });
      }
      if (url === '/security/status') {
        return Promise.resolve({ 
          data: { 
            twoFactorEnabled: false, 
            encryptionEnabled: false,
            trustedIPsCount: 0,
            isLocked: false,
          } 
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('should render security tab', async () => {
    render(<UserSettings onClose={() => {}} />);
    
    const securityTab = screen.getByText('Безопасность');
    expect(securityTab).toBeInTheDocument();
  });

  it('should load security status when security tab is clicked', async () => {
    render(<UserSettings onClose={() => {}} />);
    
    const securityTab = screen.getByText('Безопасность');
    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(monitoredApi.get).toHaveBeenCalledWith('/security/status');
    });
  });

  it('should display 2FA status correctly', async () => {
    render(<UserSettings onClose={() => {}} />);
    
    const securityTab = screen.getByText('Безопасность');
    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(screen.getByText('Двухфакторная аутентификация (2FA)')).toBeInTheDocument();
      expect(screen.getByText('Отключена')).toBeInTheDocument();
    });
  });

  it('should show enable 2FA button when 2FA is disabled', async () => {
    render(<UserSettings onClose={() => {}} />);
    
    const securityTab = screen.getByText('Безопасность');
    fireEvent.click(securityTab);

    await waitFor(() => {
      const enableButton = screen.getByText('Включить 2FA');
      expect(enableButton).toBeInTheDocument();
    });
  });

  it('should show disable 2FA button when 2FA is enabled', async () => {
    (monitoredApi.get as any).mockImplementation((url: string) => {
      if (url === '/security/status') {
        return Promise.resolve({ 
          data: { 
            twoFactorEnabled: true, 
            encryptionEnabled: false,
            trustedIPsCount: 0,
            isLocked: false,
          } 
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(<UserSettings onClose={() => {}} />);
    
    const securityTab = screen.getByText('Безопасность');
    fireEvent.click(securityTab);

    await waitFor(() => {
      const disableButton = screen.getByText('Отключить 2FA');
      expect(disableButton).toBeInTheDocument();
      expect(screen.getByText('Включена')).toBeInTheDocument();
    });
  });

  it('should render change password form', async () => {
    render(<UserSettings onClose={() => {}} />);
    
    const securityTab = screen.getByText('Безопасность');
    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(screen.getByText('Изменить пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Текущий пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Подтвердите новый пароль')).toBeInTheDocument();
    });
  });

  it('should call change password API on form submit', async () => {
    (monitoredApi.post as any).mockResolvedValue({ data: { success: true } });

    render(<UserSettings onClose={() => {}} />);
    
    const securityTab = screen.getByText('Безопасность');
    fireEvent.click(securityTab);

    await waitFor(() => {
      const currentPasswordInput = screen.getByLabelText('Текущий пароль');
      const newPasswordInput = screen.getByLabelText('Новый пароль');
      const confirmPasswordInput = screen.getByLabelText('Подтвердите новый пароль');

      fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

      const submitButton = screen.getByText('Изменить пароль');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(monitoredApi.post).toHaveBeenCalledWith('/users/change-password', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      });
    });
  });

  it('should display security account status', async () => {
    (monitoredApi.get as any).mockImplementation((url: string) => {
      if (url === '/security/status') {
        return Promise.resolve({ 
          data: { 
            twoFactorEnabled: true, 
            encryptionEnabled: true,
            trustedIPsCount: 2,
            isLocked: false,
          } 
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(<UserSettings onClose={() => {}} />);
    
    const securityTab = screen.getByText('Безопасность');
    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(screen.getByText('Статус аккаунта')).toBeInTheDocument();
      expect(screen.getByText('E2E шифрование:')).toBeInTheDocument();
      expect(screen.getByText('Доверенные IP:')).toBeInTheDocument();
    });
  });
});

describe('UserSettings - Profile Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (monitoredApi.get as any).mockImplementation((url: string) => {
      if (url === '/users/me') {
        return Promise.resolve({ 
          data: { 
            id: '1', 
            username: 'testuser', 
            displayName: 'Test User',
            bio: 'Test bio',
            status: 'Available',
            avatar: null
          } 
        });
      }
      if (url === '/users/privacy') {
        return Promise.resolve({ data: { showOnlineStatus: true, showProfilePhoto: true, showLastSeen: true } });
      }
      if (url === '/users/notifications') {
        return Promise.resolve({ 
          data: { 
            notificationsPush: true, 
            notificationsEmail: true, 
            notificationsSound: true, 
            notificationsVibration: true 
          } 
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('should render profile tab with editable fields', async () => {
    render(<UserSettings onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('Профиль')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your display name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What\'s your status?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tell us about yourself')).toBeInTheDocument();
    });
  });

  it('should populate form fields with user data', async () => {
    render(<UserSettings onClose={() => {}} />);
    
    await waitFor(() => {
      const displayNameInput = screen.getByPlaceholderText('Enter your display name') as HTMLInputElement;
      const statusInput = screen.getByPlaceholderText('What\'s your status?') as HTMLInputElement;
      const bioInput = screen.getByPlaceholderText('Tell us about yourself') as HTMLTextAreaElement;

      expect(displayNameInput.value).toBe('Test User');
      expect(statusInput.value).toBe('Available');
      expect(bioInput.value).toBe('Test bio');
    });
  });

  it('should allow editing profile fields', async () => {
    render(<UserSettings onClose={() => {}} />);
    
    await waitFor(() => {
      const displayNameInput = screen.getByPlaceholderText('Enter your display name');
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
      
      expect((displayNameInput as HTMLInputElement).value).toBe('Updated Name');
    });
  });

  it('should call updateProfile API on save', async () => {
    (userApi.updateProfile as any).mockResolvedValue({ 
      data: { 
        id: '1', 
        username: 'testuser', 
        displayName: 'Updated Name',
        bio: 'Updated bio',
        status: 'Busy'
      } 
    });

    render(<UserSettings onClose={() => {}} />);
    
    await waitFor(() => {
      const displayNameInput = screen.getByPlaceholderText('Enter your display name');
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
    });

    const saveButton = screen.getByText('Сохранить профиль');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(userApi.updateProfile).toHaveBeenCalled();
    });
  });

  it('should show save button and change to loading state when saving', async () => {
    (userApi.updateProfile as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
    );

    render(<UserSettings onClose={() => {}} />);
    
    await waitFor(() => {
      const saveButton = screen.getByText('Сохранить профиль');
      expect(saveButton).toBeInTheDocument();
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Сохранение...')).toBeInTheDocument();
    });
  });
});
