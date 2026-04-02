import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { monitoredApi } from '../../utils/monitoredApi';
import { userApi } from '../../services/api';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../../utils/pushNotifications';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationSound } from '../../utils/notificationSound';
import { useConfirm } from '../confirm/ConfirmDialogProvider';
import { Folder, SettingsSection, Session, StorageInfo } from './types';

interface UseUserSettingsDataOptions {
  section: SettingsSection;
  setAuthUser: (user: any) => void;
}

export function useUserSettingsData({ section, setAuthUser }: UseUserSettingsDataOptions) {
  const confirm = useConfirm();
  const [user, setUser] = useState<any>(null);
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showProfilePhoto: true,
    showLastSeen: true,
  });
  const [notifications, setNotifications] = useState({
    notificationsPush: true,
    notificationsEmail: true,
    notificationsSound: true,
    notificationsVibration: true,
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileFormData, setProfileFormData] = useState({
    displayName: '',
    bio: '',
    status: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const updateNotificationsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const response = await monitoredApi.get('/users/me');
      setUser(response.data);
      setProfileFormData({
        displayName: response.data.displayName || '',
        bio: response.data.bio || '',
        status: response.data.status || '',
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, []);

  const loadPrivacySettings = useCallback(async () => {
    try {
      const response = await monitoredApi.get('/users/privacy');
      setPrivacy(response.data);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  }, []);

  const loadNotificationPreferences = useCallback(async () => {
    try {
      const response = await monitoredApi.get('/users/notifications');
      setNotifications(response.data);

      if (response.data.notificationsSound !== undefined) {
        useNotificationStore.getState().setSoundEnabled(response.data.notificationsSound);
      }
      if (response.data.notificationsVibration !== undefined) {
        useNotificationStore.getState().setVibrationEnabled(response.data.notificationsVibration);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const response = await monitoredApi.get('/users/sessions');
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Не удалось загрузить сеансы');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const loadStorageInfo = useCallback(async () => {
    setLoadingStorage(true);
    try {
      const response = await monitoredApi.get('/users/storage');
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  const loadSecurityStatus = useCallback(async () => {
    try {
      const response = await monitoredApi.get('/security/status');
      setSecurityStatus(response.data);
    } catch (error) {
      console.error('Failed to load security status:', error);
    }
  }, []);

  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const response = await monitoredApi.get('/folders');
      setFolders(response.data.folders || []);
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast.error('Не удалось загрузить папки');
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadPrivacySettings();
    loadNotificationPreferences();
  }, [loadNotificationPreferences, loadPrivacySettings, loadUserData]);

  useEffect(() => {
    if (section === 'sessions') {
      loadSessions();
    } else if (section === 'data') {
      loadStorageInfo();
    } else if (section === 'security') {
      loadSecurityStatus();
    } else if (section === 'folders') {
      loadFolders();
    }
  }, [section, loadFolders, loadSecurityStatus, loadSessions, loadStorageInfo]);

  const handlePrivacyChange = async (key: string, value: boolean) => {
    try {
      const response = await monitoredApi.patch('/users/privacy', { [key]: value });
      if (response.data?.settings) {
        setPrivacy(response.data.settings);
      } else {
        setPrivacy((current) => ({ ...current, [key]: value }));
      }
      toast.success('Настройки обновлены');
    } catch (error: any) {
      console.error('Failed to update privacy:', error);
      const errorMessage = error?.response?.data?.error || 'Ошибка обновления настроек приватности';
      toast.error(errorMessage);
      setPrivacy((current) => ({ ...current, [key]: !value }));
    }
  };

  const debouncedUpdateNotifications = useCallback(
    (prefs: typeof notifications, onError?: () => void) => {
      if (updateNotificationsTimeoutRef.current) {
        clearTimeout(updateNotificationsTimeoutRef.current);
      }

      updateNotificationsTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await monitoredApi.patch('/users/notifications', prefs);
          if (response.data?.preferences) {
            setNotifications(response.data.preferences);
          }
        } catch (error: any) {
          console.error('Failed to update notifications:', error);
          const errorMessage = error?.response?.data?.error || 'Ошибка обновления уведомлений';
          toast.error(errorMessage);
          if (onError) {
            onError();
          } else {
            loadNotificationPreferences();
          }
        }
      }, 500);
    },
    [loadNotificationPreferences, notifications],
  );

  const handleNotificationChange = async (key: keyof typeof notifications, value: boolean) => {
    const previousState = { ...notifications };
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);

    if (key === 'notificationsPush') {
      try {
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (value && vapidKey) {
          await subscribeToPushNotifications(vapidKey);
        } else if (!value) {
          await unsubscribeFromPushNotifications();
        }
      } catch (error) {
        console.error('Push notification error:', error);
      }
    }

    if (key === 'notificationsSound') {
      useNotificationStore.getState().setSoundEnabled(value);
      if (value) {
        notificationSound.playMessageSound();
      }
    }

    if (key === 'notificationsVibration') {
      useNotificationStore.getState().setVibrationEnabled(value);
    }

    debouncedUpdateNotifications(updated, () => {
      setNotifications(previousState);
      loadNotificationPreferences();
    });
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не более 5 МБ');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const formData = new FormData();

      formData.append('displayName', profileFormData.displayName);
      formData.append('bio', profileFormData.bio);
      formData.append('status', profileFormData.status);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await userApi.updateProfile(formData);
      setUser(response.data);
      setAuthUser(response.data);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Профиль обновлён');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'Ошибка обновления профиля');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (changePasswordData.newPassword.length < 8) {
      toast.error('Пароль должен быть не менее 8 символов');
      return;
    }

    try {
      await monitoredApi.post('/users/change-password', {
        currentPassword: changePasswordData.currentPassword,
        newPassword: changePasswordData.newPassword,
      });
      toast.success('Пароль изменён');
      setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка смены пароля');
    }
  };

  const handleDisable2FA = async () => {
    const shouldDisable = await confirm({
      title: 'Отключить 2FA',
      message: 'Двухфакторная аутентификация будет отключена для вашего аккаунта.',
      confirmText: 'Отключить',
      tone: 'danger',
    });

    if (!shouldDisable) {
      return;
    }

    const code = prompt('Введите код 2FA:');
    if (!code) {
      return;
    }

    try {
      await monitoredApi.post('/security/2fa/disable', { code });
      toast.success('2FA отключена');
      await loadSecurityStatus();
    } catch {
      toast.error('Ошибка отключения 2FA');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await monitoredApi.delete(`/users/sessions/${sessionId}`);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      toast.success('Сеанс завершён');
    } catch {
      toast.error('Ошибка завершения сеанса');
    }
  };

  const handleRevokeAllSessions = async () => {
    const shouldRevoke = await confirm({
      title: 'Завершить все сеансы',
      message: 'Все другие активные сеансы будут завершены. Текущий сеанс останется активным.',
      confirmText: 'Завершить',
      tone: 'danger',
    });

    if (!shouldRevoke) {
      return;
    }

    try {
      await monitoredApi.delete('/users/sessions');
      await loadSessions();
      toast.success('Все сеансы завершены');
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleClearCache = async () => {
    const shouldClear = await confirm({
      title: 'Очистить кэш',
      message: 'Временные данные приложения будут удалены. Чаты и файлы это не затронет.',
      confirmText: 'Очистить',
      tone: 'danger',
    });

    if (!shouldClear) {
      return;
    }

    try {
      await monitoredApi.post('/users/storage/clear-cache');
      await loadStorageInfo();
      toast.success('Кэш очищен');
    } catch {
      toast.error('Ошибка очистки кэша');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await monitoredApi.get('/users/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stogram-export-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Данные экспортированы');
    } catch {
      toast.error('Ошибка экспорта');
    }
  };

  const handleImportData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await monitoredApi.post('/users/import', data);
      toast.success('Данные импортированы');
      await loadUserData();
    } catch {
      toast.error('Ошибка импорта');
    }

    event.target.value = '';
  };

  const resetFolderForm = () => {
    return { editingFolder: null as Folder | null, folderName: '', folderColor: '#3390ec' };
  };

  const handleSaveFolder = async (
    editingFolder: Folder | null,
    folderName: string,
    folderColor: string,
    onSuccess: () => void,
  ) => {
    const trimmedName = folderName.trim();
    if (!trimmedName) {
      toast.error('Введите название папки');
      return;
    }

    try {
      if (editingFolder) {
        await monitoredApi.put(`/folders/${editingFolder.id}`, {
          name: trimmedName,
          color: folderColor,
          icon: editingFolder.icon || 'Folder',
        });
        toast.success('Папка обновлена');
      } else {
        await monitoredApi.post('/folders', {
          name: trimmedName,
          color: folderColor,
          icon: 'Folder',
        });
        toast.success('Папка создана');
      }

      onSuccess();
      await loadFolders();
    } catch (error) {
      console.error('Failed to save folder:', error);
      toast.error('Не удалось сохранить папку');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const shouldDelete = await confirm({
      title: 'Удалить папку',
      message: 'Папка будет удалена, а привязанные чаты останутся в общем списке.',
      confirmText: 'Удалить',
      tone: 'danger',
    });

    if (!shouldDelete) {
      return;
    }

    try {
      await monitoredApi.delete(`/folders/${folderId}`);
      setFolders((current) => current.filter((folder) => folder.id !== folderId));
      toast.success('Папка удалена');
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('Не удалось удалить папку');
    }
  };

  return {
    user,
    privacy,
    notifications,
    sessions,
    storageInfo,
    folders,
    loadingSessions,
    loadingStorage,
    loadingFolders,
    securityStatus,
    changePasswordData,
    profileFormData,
    avatarFile,
    avatarPreview,
    savingProfile,
    setChangePasswordData,
    setProfileFormData,
    setAvatarFile,
    setAvatarPreview,
    setFolders,
    loadSecurityStatus,
    handlePrivacyChange,
    handleNotificationChange,
    handleAvatarChange,
    handleProfileSave,
    handleChangePassword,
    handleDisable2FA,
    handleRevokeSession,
    handleRevokeAllSessions,
    handleClearCache,
    handleExportData,
    handleImportData,
    resetFolderForm,
    handleSaveFolder,
    handleDeleteFolder,
  };
}
