import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { usePerformanceMonitor } from '../utils/performance';
import { monitoredApi } from '../utils/monitoredApi';
import { userApi } from '../services/api';
import { getMediaUrl } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  ArrowLeft,
  Camera,
  MessageCircle,
  Shield,
  Bell,
  Database,
  Zap,
  FolderOpen,
  Palette,
  Bot,
  Monitor,
  HardDrive,
  Download,
  Upload,
  Trash2,
  X,
  ChevronRight,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../utils/pushNotifications';
import { useNotificationStore } from '../store/notificationStore';
import { notificationSound } from '../utils/notificationSound';
import { LazyBotManager } from './LazyComponents';

const LazyTwoFactorAuth = lazy(() => import('./TwoFactorAuth'));

interface UserSettingsProps {
  onClose: () => void;
}

interface Session {
  id: string;
  device: string;
  ipAddress: string;
  userAgent: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

interface StorageInfo {
  messages: { count: number; estimatedBytes: number };
  media: { count: number; totalBytes: number };
  contacts: { count: number; estimatedBytes: number };
  chats: { count: number; estimatedBytes: number };
  cache: { entriesCount: number; estimatedBytes: number };
  total: { estimatedBytes: number; formatted: string };
}

type SettingsSection = 'main' | 'chat-settings' | 'privacy' | 'notifications' | 'data' | 'appearance' | 'security' | 'sessions' | 'bots';

/**
 * Telegram-style full-screen settings page with profile header and grouped settings.
 */
const UserSettings: React.FC<UserSettingsProps> = ({ onClose }) => {
  const { startRender, trackInteraction } = usePerformanceMonitor('UserSettings');
  const { setUser: setAuthUser } = useAuthStore();
  const { setTheme } = useThemeStore();

  const [section, setSection] = useState<SettingsSection>('main');
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
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const updateNotificationsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [profileFormData, setProfileFormData] = useState({
    displayName: '',
    bio: '',
    status: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startRender();
    trackInteraction('settings_open', 'UserSettings');
    loadUserData();
    loadPrivacySettings();
    loadNotificationPreferences();
  }, []);

  /* ── Data Loading ── */
  const loadUserData = async () => {
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
  };

  const loadPrivacySettings = async () => {
    try {
      const response = await monitoredApi.get('/users/privacy');
      setPrivacy(response.data);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const loadNotificationPreferences = async () => {
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
  };

  const loadSessions = async () => {
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
  };

  const loadStorageInfo = async () => {
    setLoadingStorage(true);
    try {
      const response = await monitoredApi.get('/users/storage');
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    } finally {
      setLoadingStorage(false);
    }
  };

  const loadSecurityStatus = async () => {
    try {
      const response = await monitoredApi.get('/security/status');
      setSecurityStatus(response.data);
    } catch (error) {
      console.error('Failed to load security status:', error);
    }
  };

  /* ── Handlers ── */
  const handlePrivacyChange = async (key: string, value: boolean) => {
    try {
      await monitoredApi.patch('/users/privacy', { [key]: value });
      setPrivacy({ ...privacy, [key]: value });
      toast.success('Настройки обновлены');
    } catch (error) {
      console.error('Failed to update privacy:', error);
      toast.error('Ошибка обновления');
    }
  };

  const debouncedUpdateNotifications = useCallback(
    (prefs: typeof notifications) => {
      if (updateNotificationsTimeoutRef.current) clearTimeout(updateNotificationsTimeoutRef.current);
      updateNotificationsTimeoutRef.current = setTimeout(async () => {
        try {
          await monitoredApi.patch('/users/notifications', prefs);
        } catch (error) {
          console.error('Failed to update notifications:', error);
          toast.error('Ошибка обновления уведомлений');
        }
      }, 500);
    },
    [],
  );

  const handleNotificationChange = async (key: keyof typeof notifications, value: boolean) => {
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
      if (value) notificationSound.playMessageSound();
    }
    if (key === 'notificationsVibration') {
      useNotificationStore.getState().setVibrationEnabled(value);
    }
    debouncedUpdateNotifications(updated);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      if (profileFormData.displayName !== user?.displayName) formData.append('displayName', profileFormData.displayName);
      if (profileFormData.bio !== (user?.bio || '')) formData.append('bio', profileFormData.bio);
      if (profileFormData.status !== (user?.status || '')) formData.append('status', profileFormData.status);
      if (avatarFile) formData.append('avatar', avatarFile);

      const response = await userApi.updateProfile(formData);
      setUser(response.data);
      setAuthUser(response.data);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Профиль обновлён');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка обновления профиля');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!confirm('Отключить двухфакторную аутентификацию?')) return;
    const code = prompt('Введите код 2FA:');
    if (!code) return;
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
      setSessions((s) => s.filter((x) => x.id !== sessionId));
      toast.success('Сеанс завершён');
    } catch {
      toast.error('Ошибка завершения сеанса');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Завершить все другие сеансы?')) return;
    try {
      await monitoredApi.delete('/users/sessions');
      await loadSessions();
      toast.success('Все сеансы завершены');
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Очистить кэш?')) return;
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

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
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

  /** Load data when entering a sub-section */
  useEffect(() => {
    if (section === 'sessions') loadSessions();
    else if (section === 'data') loadStorageInfo();
    else if (section === 'security') loadSecurityStatus();
  }, [section]);

  /* ── UI Helpers ── */
  const avatarSrc = avatarPreview || getMediaUrl(user?.avatar) || '';
  const displayName = user?.displayName || user?.username || '';

  const goBack = () => {
    if (section === 'main') {
      onClose();
    } else {
      setSection('main');
    }
  };

  /** Generic section header */
  const SectionHeader = ({ title }: { title: string }) => (
    <div className="sticky top-0 z-10 flex items-center h-14 px-2 bg-[#517da2] dark:bg-[#17212b] text-white">
      <button onClick={goBack} className="p-2.5 hover:bg-white/10 rounded-full transition">
        <ArrowLeft className="w-[22px] h-[22px]" />
      </button>
      <h2 className="ml-3 text-[19px] font-semibold">{title}</h2>
    </div>
  );

  /** Toggle switch row */
  const ToggleRow = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex-1 mr-4">
        <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{label}</p>
        {description && <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883] mt-0.5">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-[42px] h-[24px] bg-gray-300 rounded-full peer dark:bg-gray-600 peer-checked:bg-[#3390ec] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-transform peer-checked:after:translate-x-[18px] after:shadow-sm" />
      </label>
    </div>
  );

  /** Menu row with chevron */
  const MenuRow = ({
    icon: Icon,
    label,
    subtitle,
    onClick,
    color,
  }: {
    icon: React.ElementType;
    label: string;
    subtitle?: string;
    onClick: () => void;
    color?: string;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-5 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors active:bg-gray-100 dark:active:bg-[#2b3a47]"
    >
      <Icon className={`w-[22px] h-[22px] ${color || 'text-[#8e8e93] dark:text-[#6c7883]'}`} />
      <div className="flex-1 text-left">
        <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{label}</p>
        {subtitle && <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">{subtitle}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-[#c7c7cc] dark:text-[#4e5b65]" />
    </button>
  );

  const Divider = () => <div className="h-2 bg-[#efeff4] dark:bg-[#0e1621]" />;
  const SectionLabel = ({ text }: { text: string }) => (
    <p className="px-5 pt-5 pb-2 text-[13px] font-semibold text-[#3390ec] uppercase tracking-wide">{text}</p>
  );

  /* ── RENDER ── */
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        trackInteraction('settings_error', 'UserSettings');
        console.error('UserSettings error:', error, errorInfo);
      }}
    >
      <div className="fixed inset-0 bg-white dark:bg-[#0b141a] z-50 flex flex-col overflow-hidden">
        {/* ── MAIN Profile View ── */}
        {section === 'main' && (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center h-14 px-2 bg-[#517da2] dark:bg-[#17212b] text-white">
              <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition">
                <ArrowLeft className="w-[22px] h-[22px]" />
              </button>
              <span className="flex-1" />
            </div>

            {/* Avatar + Name */}
            <div className="flex flex-col items-center py-6 bg-white dark:bg-[#17212b]">
              <div className="relative">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={displayName} className="w-[110px] h-[110px] rounded-full object-cover" />
                ) : (
                  <div className="w-[110px] h-[110px] rounded-full bg-[#3390ec] flex items-center justify-center text-white text-4xl font-bold">
                    {displayName.charAt(0) || 'U'}
                  </div>
                )}
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-[#3390ec] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#2b7fd4] transition"
                  aria-label="Изменить фото"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <h2 className="mt-4 text-[22px] font-semibold text-[#222] dark:text-white">{displayName}</h2>
              <p className="text-[14px] text-[#4fae4e] mt-0.5">в сети</p>
            </div>

            <Divider />

            {/* Account Info */}
            <div className="bg-white dark:bg-[#17212b]">
              <SectionLabel text="Аккаунт" />

              {/* Phone (placeholder) */}
              <div className="px-5 py-3.5">
                <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{user?.email || '—'}</p>
                <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">Email</p>
              </div>

              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />

              {/* Username */}
              <div className="px-5 py-3.5">
                <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">@{user?.username || ''}</p>
                <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">Имя пользователя</p>
              </div>

              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />

              {/* Bio */}
              <div className="px-5 py-3.5">
                <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{user?.bio || 'Напишите немного о себе'}</p>
                <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">О себе</p>
              </div>

              {(avatarFile || profileFormData.displayName !== (user?.displayName || '') || profileFormData.bio !== (user?.bio || '')) && (
                <div className="px-5 py-3">
                  <button
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="w-full py-2.5 bg-[#3390ec] text-white rounded-lg font-medium text-[15px] hover:bg-[#2b7fd4] transition disabled:opacity-50"
                  >
                    {savingProfile ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              )}
            </div>

            <Divider />

            {/* Settings Menu */}
            <div className="bg-white dark:bg-[#17212b]">
              <SectionLabel text="Настройки" />
              <MenuRow icon={MessageCircle} label="Настройки чатов" onClick={() => setSection('chat-settings')} color="text-[#3390ec]" />
              <MenuRow icon={Shield} label="Конфиденциальность" onClick={() => setSection('privacy')} color="text-[#8e8e93]" />
              <MenuRow icon={Bell} label="Уведомления и звуки" onClick={() => setSection('notifications')} color="text-[#ef5350]" />
              <MenuRow icon={Database} label="Данные и память" onClick={() => setSection('data')} color="text-[#4fae4e]" />
              <MenuRow icon={Palette} label="Внешний вид" onClick={() => setSection('appearance')} color="text-[#e67e22]" />
              <MenuRow icon={FolderOpen} label="Папки с чатами" onClick={() => {}} color="text-[#3390ec]" />
            </div>

            <Divider />

            <div className="bg-white dark:bg-[#17212b]">
              <MenuRow icon={Shield} label="Безопасность" subtitle="2FA, пароль" onClick={() => setSection('security')} color="text-[#8e8e93]" />
              <MenuRow icon={Monitor} label="Активные сеансы" onClick={() => setSection('sessions')} color="text-[#3390ec]" />
              <MenuRow icon={Bot} label="Боты" onClick={() => setSection('bots')} color="text-[#9c27b0]" />
            </div>

            <Divider />
            <div className="h-8" />
          </div>
        )}

        {/* ── PRIVACY ── */}
        {section === 'privacy' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Конфиденциальность" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              <SectionLabel text="Приватность" />
              <ToggleRow label="Показывать статус онлайн" description="Другие видят, когда вы в сети" checked={privacy.showOnlineStatus} onChange={(v) => handlePrivacyChange('showOnlineStatus', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Время последнего посещения" description="Когда вы были онлайн" checked={privacy.showLastSeen} onChange={(v) => handlePrivacyChange('showLastSeen', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Фото профиля" description="Видимость для других" checked={privacy.showProfilePhoto} onChange={(v) => handlePrivacyChange('showProfilePhoto', v)} />
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {section === 'notifications' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Уведомления и звуки" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              <SectionLabel text="Уведомления" />
              <ToggleRow label="Push-уведомления" description="Получать уведомления о сообщениях" checked={notifications.notificationsPush} onChange={(v) => handleNotificationChange('notificationsPush', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Email-уведомления" checked={notifications.notificationsEmail} onChange={(v) => handleNotificationChange('notificationsEmail', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Звук" description="Звук при новом сообщении" checked={notifications.notificationsSound} onChange={(v) => handleNotificationChange('notificationsSound', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Вибрация" checked={notifications.notificationsVibration} onChange={(v) => handleNotificationChange('notificationsVibration', v)} />
            </div>
          </div>
        )}

        {/* ── APPEARANCE ── */}
        {section === 'appearance' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Внешний вид" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b] p-5">
              <SectionLabel text="Тема" />
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { value: 'light' as const, label: 'Светлая', bg: 'bg-white border border-gray-200' },
                  { value: 'dark' as const, label: 'Тёмная', bg: 'bg-[#0b141a]' },
                  { value: 'system' as const, label: 'Авто', bg: 'bg-gradient-to-br from-white to-[#0b141a]' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={async () => {
                      try {
                        if (t.value !== 'system') await monitoredApi.patch('/users/theme', { theme: t.value });
                        setTheme(t.value);
                        toast.success('Тема изменена');
                      } catch {
                        toast.error('Ошибка');
                      }
                    }}
                    className={`p-3 rounded-xl border-2 transition ${
                      (user?.theme === t.value || (!user?.theme && t.value === 'system'))
                        ? 'border-[#3390ec]'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-full h-16 rounded-lg mb-2 ${t.bg}`} />
                    <p className="text-[13px] font-medium text-[#222] dark:text-[#e1e1e1]">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {section === 'security' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Безопасность" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              <SectionLabel text="Двухфакторная аутентификация" />
              <div className="px-5 py-3.5">
                {securityStatus ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">
                        Статус: {securityStatus.twoFactorEnabled ? (
                          <span className="text-[#4fae4e] font-medium">Включена</span>
                        ) : (
                          <span className="text-[#ef5350] font-medium">Отключена</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={securityStatus.twoFactorEnabled ? handleDisable2FA : () => setShow2FAModal(true)}
                      className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                        securityStatus.twoFactorEnabled ? 'bg-[#ef5350]' : 'bg-[#3390ec]'
                      }`}
                    >
                      {securityStatus.twoFactorEnabled ? 'Отключить' : 'Включить'}
                    </button>
                  </div>
                ) : (
                  <p className="text-[#8e8e93]">Загрузка...</p>
                )}
              </div>

              <Divider />

              <SectionLabel text="Изменить пароль" />
              <form onSubmit={handleChangePassword} className="px-5 space-y-3 pb-5">
                <input
                  type="password"
                  placeholder="Текущий пароль"
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#efeff4] dark:bg-[#202b36] rounded-lg text-[15px] text-[#222] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
                  required
                />
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#efeff4] dark:bg-[#202b36] rounded-lg text-[15px] text-[#222] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
                  required
                  minLength={8}
                />
                <input
                  type="password"
                  placeholder="Подтвердите пароль"
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#efeff4] dark:bg-[#202b36] rounded-lg text-[15px] text-[#222] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
                  required
                />
                <button type="submit" className="w-full py-3 bg-[#3390ec] text-white rounded-lg font-medium hover:bg-[#2b7fd4] transition">
                  Изменить пароль
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── SESSIONS ── */}
        {section === 'sessions' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Активные сеансы" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3390ec]" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-[#8e8e93]">
                  <Monitor className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>Нет активных сеансов</p>
                </div>
              ) : (
                <>
                  {sessions.length > 1 && (
                    <div className="px-5 py-3">
                      <button onClick={handleRevokeAllSessions} className="text-[#ef5350] text-[14px] font-medium">
                        Завершить все другие сеансы
                      </button>
                    </div>
                  )}
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-[#202c33]">
                      <Monitor className="w-5 h-5 text-[#3390ec] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] text-[#222] dark:text-[#e1e1e1] truncate">{s.device || 'Устройство'}</p>
                          {s.isCurrent && (
                            <span className="px-2 py-0.5 text-[11px] bg-[#4fae4e]/20 text-[#4fae4e] rounded-full font-medium">Текущий</span>
                          )}
                        </div>
                        <p className="text-[13px] text-[#8e8e93] truncate">{s.ipAddress}</p>
                      </div>
                      {!s.isCurrent && (
                        <button onClick={() => handleRevokeSession(s.id)} className="p-1.5 text-[#ef5350] hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── DATA & STORAGE ── */}
        {section === 'data' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Данные и память" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              {loadingStorage ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3390ec]" />
                </div>
              ) : storageInfo ? (
                <>
                  <div className="px-5 py-5">
                    <div className="bg-gradient-to-br from-[#3390ec]/10 to-[#3390ec]/5 dark:from-[#3390ec]/20 dark:to-[#3390ec]/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[13px] text-[#8e8e93] font-medium uppercase">Общее использование</p>
                        <HardDrive className="w-5 h-5 text-[#3390ec]" />
                      </div>
                      <p className="text-[28px] font-bold text-[#222] dark:text-white">{storageInfo.total.formatted}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 px-5 pb-3">
                    {[
                      { label: 'Сообщения', value: storageInfo.messages.count },
                      { label: 'Медиа', value: storageInfo.media.count },
                      { label: 'Контакты', value: storageInfo.contacts.count },
                      { label: 'Чаты', value: storageInfo.chats.count },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#efeff4] dark:bg-[#202b36] rounded-lg p-3">
                        <p className="text-[12px] text-[#8e8e93]">{item.label}</p>
                        <p className="text-[18px] font-semibold text-[#222] dark:text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <Divider />

                  <MenuRow icon={Trash2} label="Очистить кэш" onClick={handleClearCache} color="text-[#e67e22]" />
                  <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
                  <MenuRow icon={Download} label="Экспорт данных" onClick={handleExportData} color="text-[#3390ec]" />
                  <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
                  <div className="px-5 py-3.5">
                    <label className="flex items-center gap-5 cursor-pointer">
                      <Upload className="w-[22px] h-[22px] text-[#4fae4e]" />
                      <div className="flex-1">
                        <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">Импорт данных</p>
                      </div>
                      <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      <ChevronRight className="w-4 h-4 text-[#c7c7cc] dark:text-[#4e5b65]" />
                    </label>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* ── CHAT SETTINGS (placeholder) ── */}
        {section === 'chat-settings' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Настройки чатов" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b] flex items-center justify-center text-[#8e8e93]">
              <p>Скоро...</p>
            </div>
          </div>
        )}

        {/* ── BOTS ── */}
        {section === 'bots' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Боты" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b] p-5">
              <Suspense fallback={<div className="text-center py-8 text-[#8e8e93]">Загрузка...</div>}>
                <LazyBotManager />
              </Suspense>
            </div>
          </div>
        )}

        {/* ── 2FA Modal ── */}
        {show2FAModal && (
          <Suspense fallback={<div>Загрузка...</div>}>
            <LazyTwoFactorAuth
              onClose={() => {
                setShow2FAModal(false);
                loadSecurityStatus();
              }}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UserSettings;
