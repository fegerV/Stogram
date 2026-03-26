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
  Archive,
  UserX,
  Plus,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../utils/pushNotifications';
import { useNotificationStore } from '../store/notificationStore';
import { notificationSound } from '../utils/notificationSound';
import { LazyBotManager } from './LazyComponents';

const LazyTwoFactorAuth = lazy(() => import('./TwoFactorAuth'));
const LazyArchivedChats = lazy(() => import('./ArchivedChats').then((module) => ({ default: module.ArchivedChats })));
const LazyBlockedUsers = lazy(() => import('./BlockedUsers'));
const LazyBotSettings = lazy(() => import('../pages/BotSettings'));
const LazyN8nSettings = lazy(() => import('../pages/N8nSettings'));

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

interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order: number;
  chatSettings?: Array<{
    chat?: {
      id: string;
      name?: string;
      type?: string;
    };
  }>;
}

type SettingsSection = 'main' | 'chat-settings' | 'privacy' | 'notifications' | 'data' | 'appearance' | 'security' | 'sessions' | 'bots' | 'folders';

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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showArchivedChats, setShowArchivedChats] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#3390ec');
  const [integrationTab, setIntegrationTab] = useState<'internal' | 'telegram' | 'n8n'>('internal');
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

  /* в”Ђв”Ђ Data Loading в”Ђв”Ђ */
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
      toast.error('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРµР°РЅСЃС‹');
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

  const loadFolders = async () => {
    setLoadingFolders(true);
    try {
      const response = await monitoredApi.get('/folders');
      setFolders(response.data.folders || []);
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast.error('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РїР°РїРєРё');
    } finally {
      setLoadingFolders(false);
    }
  };

  /* в”Ђв”Ђ Handlers в”Ђв”Ђ */
  const handlePrivacyChange = async (key: string, value: boolean) => {
    try {
      const response = await monitoredApi.patch('/users/privacy', { [key]: value });
      // Update local state with server response
      if (response.data?.settings) {
        setPrivacy(response.data.settings);
      } else {
        setPrivacy({ ...privacy, [key]: value });
      }
      toast.success('РќР°СЃС‚СЂРѕР№РєРё РѕР±РЅРѕРІР»РµРЅС‹');
    } catch (error: any) {
      console.error('Failed to update privacy:', error);
      const errorMessage = error?.response?.data?.error || 'РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ РЅР°СЃС‚СЂРѕРµРє РїСЂРёРІР°С‚РЅРѕСЃС‚Рё';
      toast.error(errorMessage);
      // Revert local state on error
      setPrivacy({ ...privacy, [key]: !value });
    }
  };

  const debouncedUpdateNotifications = useCallback(
    (prefs: typeof notifications, onError?: () => void) => {
      if (updateNotificationsTimeoutRef.current) clearTimeout(updateNotificationsTimeoutRef.current);
      updateNotificationsTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await monitoredApi.patch('/users/notifications', prefs);
          // Update local state with server response
          if (response.data?.preferences) {
            setNotifications(response.data.preferences);
          }
        } catch (error: any) {
          console.error('Failed to update notifications:', error);
          const errorMessage = error?.response?.data?.error || 'РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ СѓРІРµРґРѕРјР»РµРЅРёР№';
          toast.error(errorMessage);
          // Reload preferences from server to revert to correct state
          if (onError) {
            onError();
          } else {
            loadNotificationPreferences();
          }
        }
      }, 500);
    },
    [],
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
      if (value) notificationSound.playMessageSound();
    }
    if (key === 'notificationsVibration') {
      useNotificationStore.getState().setVibrationEnabled(value);
    }
    debouncedUpdateNotifications(updated, () => {
      // Revert to previous state on error
      setNotifications(previousState);
      loadNotificationPreferences();
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Р Р°Р·РјРµСЂ С„Р°Р№Р»Р° РЅРµ Р±РѕР»РµРµ 5 РњР‘');
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
      
      // Always send displayName, bio, status if they exist (even if unchanged)
      // This ensures the form data is properly structured
      if (profileFormData.displayName !== undefined) {
        formData.append('displayName', profileFormData.displayName);
      }
      if (profileFormData.bio !== undefined) {
        formData.append('bio', profileFormData.bio);
      }
      if (profileFormData.status !== undefined) {
        formData.append('status', profileFormData.status);
      }
      
      // Always send avatar file if selected
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await userApi.updateProfile(formData);
      
      // Update user state with response data
      setUser(response.data);
      setAuthUser(response.data);
      
      // Clear preview only after successful save
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Force re-render to show new avatar
      // The avatarSrc will use the new user.avatar from response
      
      toast.success('РџСЂРѕС„РёР»СЊ РѕР±РЅРѕРІР»С‘РЅ');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ РїСЂРѕС„РёР»СЏ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast.error('РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚');
      return;
    }
    if (changePasswordData.newPassword.length < 8) {
      toast.error('РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РЅРµ РјРµРЅРµРµ 8 СЃРёРјРІРѕР»РѕРІ');
      return;
    }
    try {
      await monitoredApi.post('/users/change-password', {
        currentPassword: changePasswordData.currentPassword,
        newPassword: changePasswordData.newPassword,
      });
      toast.success('РџР°СЂРѕР»СЊ РёР·РјРµРЅС‘РЅ');
      setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'РћС€РёР±РєР° СЃРјРµРЅС‹ РїР°СЂРѕР»СЏ');
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('РћС‚РєР»СЋС‡РёС‚СЊ РґРІСѓС…С„Р°РєС‚РѕСЂРЅСѓСЋ Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёСЋ?')) return;
    const code = prompt('Р’РІРµРґРёС‚Рµ РєРѕРґ 2FA:');
    if (!code) return;
    try {
      await monitoredApi.post('/security/2fa/disable', { code });
      toast.success('2FA РѕС‚РєР»СЋС‡РµРЅР°');
      await loadSecurityStatus();
    } catch {
      toast.error('РћС€РёР±РєР° РѕС‚РєР»СЋС‡РµРЅРёСЏ 2FA');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await monitoredApi.delete(`/users/sessions/${sessionId}`);
      setSessions((s) => s.filter((x) => x.id !== sessionId));
      toast.success('РЎРµР°РЅСЃ Р·Р°РІРµСЂС€С‘РЅ');
    } catch {
      toast.error('РћС€РёР±РєР° Р·Р°РІРµСЂС€РµРЅРёСЏ СЃРµР°РЅСЃР°');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Р—Р°РІРµСЂС€РёС‚СЊ РІСЃРµ РґСЂСѓРіРёРµ СЃРµР°РЅСЃС‹?')) return;
    try {
      await monitoredApi.delete('/users/sessions');
      await loadSessions();
      toast.success('Р’СЃРµ СЃРµР°РЅСЃС‹ Р·Р°РІРµСЂС€РµРЅС‹');
    } catch {
      toast.error('РћС€РёР±РєР°');
    }
  };

  const handleClearCache = async () => {
    if (!confirm('РћС‡РёСЃС‚РёС‚СЊ РєСЌС€?')) return;
    try {
      await monitoredApi.post('/users/storage/clear-cache');
      await loadStorageInfo();
      toast.success('РљСЌС€ РѕС‡РёС‰РµРЅ');
    } catch {
      toast.error('РћС€РёР±РєР° РѕС‡РёСЃС‚РєРё РєСЌС€Р°');
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
      toast.success('Р”Р°РЅРЅС‹Рµ СЌРєСЃРїРѕСЂС‚РёСЂРѕРІР°РЅС‹');
    } catch {
      toast.error('РћС€РёР±РєР° СЌРєСЃРїРѕСЂС‚Р°');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await monitoredApi.post('/users/import', data);
      toast.success('Р”Р°РЅРЅС‹Рµ РёРјРїРѕСЂС‚РёСЂРѕРІР°РЅС‹');
      await loadUserData();
    } catch {
      toast.error('РћС€РёР±РєР° РёРјРїРѕСЂС‚Р°');
    }
    event.target.value = '';
  };

  const resetFolderForm = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderColor('#3390ec');
  };

  const handleOpenCreateFolder = () => {
    resetFolderForm();
    setShowFolderModal(true);
  };

  const handleOpenEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color || '#3390ec');
    setShowFolderModal(true);
  };

  const handleSaveFolder = async () => {
    const trimmedName = folderName.trim();
    if (!trimmedName) {
      toast.error('Р’РІРµРґРёС‚Рµ РЅР°Р·РІР°РЅРёРµ РїР°РїРєРё');
      return;
    }

    try {
      if (editingFolder) {
        await monitoredApi.put(`/folders/${editingFolder.id}`, {
          name: trimmedName,
          color: folderColor,
          icon: editingFolder.icon || 'Folder',
        });
        toast.success('РџР°РїРєР° РѕР±РЅРѕРІР»РµРЅР°');
      } else {
        await monitoredApi.post('/folders', {
          name: trimmedName,
          color: folderColor,
          icon: 'Folder',
        });
        toast.success('РџР°РїРєР° СЃРѕР·РґР°РЅР°');
      }

      setShowFolderModal(false);
      resetFolderForm();
      await loadFolders();
    } catch (error) {
      console.error('Failed to save folder:', error);
      toast.error('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїР°РїРєСѓ');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('РЈРґР°Р»РёС‚СЊ РїР°РїРєСѓ?')) return;

    try {
      await monitoredApi.delete(`/folders/${folderId}`);
      setFolders((current) => current.filter((folder) => folder.id !== folderId));
      toast.success('РџР°РїРєР° СѓРґР°Р»РµРЅР°');
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РїР°РїРєСѓ');
    }
  };

  /** Load data when entering a sub-section */
  useEffect(() => {
    if (section === 'sessions') loadSessions();
    else if (section === 'data') loadStorageInfo();
    else if (section === 'security') loadSecurityStatus();
    else if (section === 'folders') loadFolders();
  }, [section]);

  /* в”Ђв”Ђ UI Helpers в”Ђв”Ђ */
  // Use preview if available (during selection), otherwise use saved avatar
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

  /* в”Ђв”Ђ RENDER в”Ђв”Ђ */
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        trackInteraction('settings_error', 'UserSettings');
        console.error('UserSettings error:', error, errorInfo);
      }}
    >
      <div className="fixed inset-0 bg-white dark:bg-[#0b141a] z-50 flex flex-col overflow-hidden">
        {/* в”Ђв”Ђ MAIN Profile View в”Ђв”Ђ */}
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
                  aria-label="РР·РјРµРЅРёС‚СЊ С„РѕС‚Рѕ"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <h2 className="mt-4 text-[22px] font-semibold text-[#222] dark:text-white">{displayName}</h2>
              <p className="text-[14px] text-[#4fae4e] mt-0.5">РІ СЃРµС‚Рё</p>
            </div>

            <Divider />

            {/* Account Info */}
            <div className="bg-white dark:bg-[#17212b]">
              <SectionLabel text="РђРєРєР°СѓРЅС‚" />

              {/* Phone (placeholder) */}
              <div className="px-5 py-3.5">
                <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{user?.email || 'вЂ”'}</p>
                <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">Email</p>
              </div>

              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />

              {/* Username */}
              <div className="px-5 py-3.5">
                <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">@{user?.username || ''}</p>
                <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ</p>
              </div>

              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />

              {/* Bio */}
              <div className="px-5 py-3.5">
                <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{user?.bio || 'РќР°РїРёС€РёС‚Рµ РЅРµРјРЅРѕРіРѕ Рѕ СЃРµР±Рµ'}</p>
                <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">Рћ СЃРµР±Рµ</p>
              </div>

              {(avatarFile || profileFormData.displayName !== (user?.displayName || '') || profileFormData.bio !== (user?.bio || '')) && (
                <div className="px-5 py-3">
                  <button
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="w-full py-2.5 bg-[#3390ec] text-white rounded-lg font-medium text-[15px] hover:bg-[#2b7fd4] transition disabled:opacity-50"
                  >
                    {savingProfile ? 'РЎРѕС…СЂР°РЅРµРЅРёРµ...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ'}
                  </button>
                </div>
              )}
            </div>

            <Divider />

            {/* Settings Menu */}
            <div className="bg-white dark:bg-[#17212b]">
              <SectionLabel text="РќР°СЃС‚СЂРѕР№РєРё" />
              <MenuRow icon={MessageCircle} label="РќР°СЃС‚СЂРѕР№РєРё С‡Р°С‚РѕРІ" onClick={() => setSection('chat-settings')} color="text-[#3390ec]" />
              <MenuRow icon={Shield} label="РљРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚СЊ" onClick={() => setSection('privacy')} color="text-[#8e8e93]" />
              <MenuRow icon={Bell} label="РЈРІРµРґРѕРјР»РµРЅРёСЏ Рё Р·РІСѓРєРё" onClick={() => setSection('notifications')} color="text-[#ef5350]" />
              <MenuRow icon={Database} label="Р”Р°РЅРЅС‹Рµ Рё РїР°РјСЏС‚СЊ" onClick={() => setSection('data')} color="text-[#4fae4e]" />
              <MenuRow icon={Palette} label="Р’РЅРµС€РЅРёР№ РІРёРґ" onClick={() => setSection('appearance')} color="text-[#e67e22]" />
              <MenuRow icon={FolderOpen} label="РџР°РїРєРё СЃ С‡Р°С‚Р°РјРё" onClick={() => setSection('folders')} color="text-[#3390ec]" />
            </div>

            <Divider />

            <div className="bg-white dark:bg-[#17212b]">
              <MenuRow icon={Shield} label="Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ" subtitle="2FA, РїР°СЂРѕР»СЊ" onClick={() => setSection('security')} color="text-[#8e8e93]" />
              <MenuRow icon={Monitor} label="РђРєС‚РёРІРЅС‹Рµ СЃРµР°РЅСЃС‹" onClick={() => setSection('sessions')} color="text-[#3390ec]" />
              <MenuRow icon={Bot} label="Р‘РѕС‚С‹ Рё РёРЅС‚РµРіСЂР°С†РёРё" onClick={() => setSection('bots')} color="text-[#9c27b0]" />
            </div>

            <Divider />
            <div className="h-8" />
          </div>
        )}

        {/* в”Ђв”Ђ PRIVACY в”Ђв”Ђ */}
        {section === 'privacy' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="РљРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚СЊ" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              <SectionLabel text="РџСЂРёРІР°С‚РЅРѕСЃС‚СЊ" />
              <ToggleRow label="РџРѕРєР°Р·С‹РІР°С‚СЊ СЃС‚Р°С‚СѓСЃ РѕРЅР»Р°Р№РЅ" description="Р”СЂСѓРіРёРµ РІРёРґСЏС‚, РєРѕРіРґР° РІС‹ РІ СЃРµС‚Рё" checked={privacy.showOnlineStatus} onChange={(v) => handlePrivacyChange('showOnlineStatus', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Р’СЂРµРјСЏ РїРѕСЃР»РµРґРЅРµРіРѕ РїРѕСЃРµС‰РµРЅРёСЏ" description="РљРѕРіРґР° РІС‹ Р±С‹Р»Рё РѕРЅР»Р°Р№РЅ" checked={privacy.showLastSeen} onChange={(v) => handlePrivacyChange('showLastSeen', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Р¤РѕС‚Рѕ РїСЂРѕС„РёР»СЏ" description="Р’РёРґРёРјРѕСЃС‚СЊ РґР»СЏ РґСЂСѓРіРёС…" checked={privacy.showProfilePhoto} onChange={(v) => handlePrivacyChange('showProfilePhoto', v)} />
            </div>
          </div>
        )}

        {/* в”Ђв”Ђ NOTIFICATIONS в”Ђв”Ђ */}
        {section === 'notifications' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="РЈРІРµРґРѕРјР»РµРЅРёСЏ Рё Р·РІСѓРєРё" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              <SectionLabel text="РЈРІРµРґРѕРјР»РµРЅРёСЏ" />
              <ToggleRow label="Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ" description="РџРѕР»СѓС‡Р°С‚СЊ СѓРІРµРґРѕРјР»РµРЅРёСЏ Рѕ СЃРѕРѕР±С‰РµРЅРёСЏС…" checked={notifications.notificationsPush} onChange={(v) => handleNotificationChange('notificationsPush', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Email-СѓРІРµРґРѕРјР»РµРЅРёСЏ" checked={notifications.notificationsEmail} onChange={(v) => handleNotificationChange('notificationsEmail', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Р—РІСѓРє" description="Р—РІСѓРє РїСЂРё РЅРѕРІРѕРј СЃРѕРѕР±С‰РµРЅРёРё" checked={notifications.notificationsSound} onChange={(v) => handleNotificationChange('notificationsSound', v)} />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow label="Р’РёР±СЂР°С†РёСЏ" checked={notifications.notificationsVibration} onChange={(v) => handleNotificationChange('notificationsVibration', v)} />
            </div>
          </div>
        )}

        {/* в”Ђв”Ђ APPEARANCE в”Ђв”Ђ */}
        {section === 'appearance' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Р’РЅРµС€РЅРёР№ РІРёРґ" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b] p-5">
              <SectionLabel text="РўРµРјР°" />
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { value: 'light' as const, label: 'РЎРІРµС‚Р»Р°СЏ', bg: 'bg-white border border-gray-200' },
                  { value: 'dark' as const, label: 'РўС‘РјРЅР°СЏ', bg: 'bg-[#0b141a]' },
                  { value: 'system' as const, label: 'РђРІС‚Рѕ', bg: 'bg-gradient-to-br from-white to-[#0b141a]' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={async () => {
                      try {
                        if (t.value !== 'system') await monitoredApi.patch('/users/theme', { theme: t.value });
                        setTheme(t.value);
                        toast.success('РўРµРјР° РёР·РјРµРЅРµРЅР°');
                      } catch {
                        toast.error('РћС€РёР±РєР°');
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

        {/* в”Ђв”Ђ SECURITY в”Ђв”Ђ */}
        {section === 'security' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              <SectionLabel text="Р”РІСѓС…С„Р°РєС‚РѕСЂРЅР°СЏ Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ" />
              <div className="px-5 py-3.5">
                {securityStatus ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">
                        РЎС‚Р°С‚СѓСЃ: {securityStatus.twoFactorEnabled ? (
                          <span className="text-[#4fae4e] font-medium">Р’РєР»СЋС‡РµРЅР°</span>
                        ) : (
                          <span className="text-[#ef5350] font-medium">РћС‚РєР»СЋС‡РµРЅР°</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={securityStatus.twoFactorEnabled ? handleDisable2FA : () => setShow2FAModal(true)}
                      className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                        securityStatus.twoFactorEnabled ? 'bg-[#ef5350]' : 'bg-[#3390ec]'
                      }`}
                    >
                      {securityStatus.twoFactorEnabled ? 'РћС‚РєР»СЋС‡РёС‚СЊ' : 'Р’РєР»СЋС‡РёС‚СЊ'}
                    </button>
                  </div>
                ) : (
                  <p className="text-[#8e8e93]">Р—Р°РіСЂСѓР·РєР°...</p>
                )}
              </div>

              <Divider />

              <SectionLabel text="РР·РјРµРЅРёС‚СЊ РїР°СЂРѕР»СЊ" />
              <form onSubmit={handleChangePassword} className="px-5 space-y-3 pb-5">
                <input
                  type="password"
                  placeholder="РўРµРєСѓС‰РёР№ РїР°СЂРѕР»СЊ"
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#efeff4] dark:bg-[#202b36] rounded-lg text-[15px] text-[#222] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
                  required
                />
                <input
                  type="password"
                  placeholder="РќРѕРІС‹Р№ РїР°СЂРѕР»СЊ"
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#efeff4] dark:bg-[#202b36] rounded-lg text-[15px] text-[#222] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
                  required
                  minLength={8}
                />
                <input
                  type="password"
                  placeholder="РџРѕРґС‚РІРµСЂРґРёС‚Рµ РїР°СЂРѕР»СЊ"
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#efeff4] dark:bg-[#202b36] rounded-lg text-[15px] text-[#222] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
                  required
                />
                <button type="submit" className="w-full py-3 bg-[#3390ec] text-white rounded-lg font-medium hover:bg-[#2b7fd4] transition">
                  РР·РјРµРЅРёС‚СЊ РїР°СЂРѕР»СЊ
                </button>
              </form>
            </div>
          </div>
        )}

        {/* в”Ђв”Ђ SESSIONS в”Ђв”Ђ */}
        {section === 'sessions' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="РђРєС‚РёРІРЅС‹Рµ СЃРµР°РЅСЃС‹" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3390ec]" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-[#8e8e93]">
                  <Monitor className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>РќРµС‚ Р°РєС‚РёРІРЅС‹С… СЃРµР°РЅСЃРѕРІ</p>
                </div>
              ) : (
                <>
                  {sessions.length > 1 && (
                    <div className="px-5 py-3">
                      <button onClick={handleRevokeAllSessions} className="text-[#ef5350] text-[14px] font-medium">
                        Р—Р°РІРµСЂС€РёС‚СЊ РІСЃРµ РґСЂСѓРіРёРµ СЃРµР°РЅСЃС‹
                      </button>
                    </div>
                  )}
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-[#202c33]">
                      <Monitor className="w-5 h-5 text-[#3390ec] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] text-[#222] dark:text-[#e1e1e1] truncate">{s.device || 'РЈСЃС‚СЂРѕР№СЃС‚РІРѕ'}</p>
                          {s.isCurrent && (
                            <span className="px-2 py-0.5 text-[11px] bg-[#4fae4e]/20 text-[#4fae4e] rounded-full font-medium">РўРµРєСѓС‰РёР№</span>
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

        {/* в”Ђв”Ђ DATA & STORAGE в”Ђв”Ђ */}
        {section === 'data' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Р”Р°РЅРЅС‹Рµ Рё РїР°РјСЏС‚СЊ" />
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
                        <p className="text-[13px] text-[#8e8e93] font-medium uppercase">РћР±С‰РµРµ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ</p>
                        <HardDrive className="w-5 h-5 text-[#3390ec]" />
                      </div>
                      <p className="text-[28px] font-bold text-[#222] dark:text-white">{storageInfo.total.formatted}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 px-5 pb-3">
                    {[
                      { label: 'РЎРѕРѕР±С‰РµРЅРёСЏ', value: storageInfo.messages.count },
                      { label: 'РњРµРґРёР°', value: storageInfo.media.count },
                      { label: 'РљРѕРЅС‚Р°РєС‚С‹', value: storageInfo.contacts.count },
                      { label: 'Р§Р°С‚С‹', value: storageInfo.chats.count },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#efeff4] dark:bg-[#202b36] rounded-lg p-3">
                        <p className="text-[12px] text-[#8e8e93]">{item.label}</p>
                        <p className="text-[18px] font-semibold text-[#222] dark:text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <Divider />

                  <MenuRow icon={Trash2} label="РћС‡РёСЃС‚РёС‚СЊ РєСЌС€" onClick={handleClearCache} color="text-[#e67e22]" />
                  <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
                  <MenuRow icon={Download} label="Р­РєСЃРїРѕСЂС‚ РґР°РЅРЅС‹С…" onClick={handleExportData} color="text-[#3390ec]" />
                  <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
                  <div className="px-5 py-3.5">
                    <label className="flex items-center gap-5 cursor-pointer">
                      <Upload className="w-[22px] h-[22px] text-[#4fae4e]" />
                      <div className="flex-1">
                        <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">РРјРїРѕСЂС‚ РґР°РЅРЅС‹С…</p>
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

        {/* в”Ђв”Ђ CHAT SETTINGS (placeholder) в”Ђв”Ђ */}
        {section === 'chat-settings' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="РќР°СЃС‚СЂРѕР№РєРё С‡Р°С‚РѕРІ" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              <SectionLabel text="РћСЂРіР°РЅРёР·Р°С†РёСЏ" />
              <MenuRow icon={FolderOpen} label="РџР°РїРєРё СЃ С‡Р°С‚Р°РјРё" subtitle="РЎРѕР·РґР°РЅРёРµ, РёР·РјРµРЅРµРЅРёРµ Рё СѓРґР°Р»РµРЅРёРµ РїР°РїРѕРє" onClick={() => setSection('folders')} color="text-[#3390ec]" />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <MenuRow icon={Archive} label="РђСЂС…РёРІРёСЂРѕРІР°РЅРЅС‹Рµ С‡Р°С‚С‹" subtitle="РћС‚РєСЂС‹С‚СЊ Р°СЂС…РёРІ Рё РІРµСЂРЅСѓС‚СЊ С‡Р°С‚С‹ РѕР±СЂР°С‚РЅРѕ" onClick={() => setShowArchivedChats(true)} color="text-[#8e8e93]" />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <MenuRow icon={UserX} label="Р—Р°Р±Р»РѕРєРёСЂРѕРІР°РЅРЅС‹Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»Рё" subtitle="РџСЂРѕСЃРјРѕС‚СЂ Рё СЂР°Р·Р±Р»РѕРєРёСЂРѕРІРєР°" onClick={() => setShowBlockedUsers(true)} color="text-[#ef5350]" />

              <Divider />

              <SectionLabel text="Р‘С‹СЃС‚СЂС‹Рµ РїР°СЂР°РјРµС‚СЂС‹" />
              <ToggleRow
                label="Р—РІСѓРє СѓРІРµРґРѕРјР»РµРЅРёР№"
                description="РџСЂРѕРёРіСЂС‹РІР°С‚СЊ Р·РІСѓРє РґР»СЏ РЅРѕРІС‹С… СЃРѕРѕР±С‰РµРЅРёР№"
                checked={notifications.notificationsSound}
                onChange={(value) => handleNotificationChange('notificationsSound', value)}
              />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow
                label="Р’РёР±СЂР°С†РёСЏ"
                description="РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РІРёР±СЂР°С†РёСЋ РґР»СЏ СѓРІРµРґРѕРјР»РµРЅРёР№"
                checked={notifications.notificationsVibration}
                onChange={(value) => handleNotificationChange('notificationsVibration', value)}
              />
              <div className="h-px bg-gray-100 dark:bg-[#202c33] ml-5" />
              <ToggleRow
                label="Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ"
                description="РџРѕР»СѓС‡Р°С‚СЊ СѓРІРµРґРѕРјР»РµРЅРёСЏ Рѕ РЅРѕРІС‹С… СЃРѕРѕР±С‰РµРЅРёСЏС…"
                checked={notifications.notificationsPush}
                onChange={(value) => handleNotificationChange('notificationsPush', value)}
              />
            </div>
          </div>
        )}

        {section === 'folders' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="РџР°РїРєРё СЃ С‡Р°С‚Р°РјРё" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
              <div className="px-5 py-4">
                <button
                  onClick={handleOpenCreateFolder}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#3390ec] text-white rounded-xl font-medium hover:bg-[#2b7fd4] transition"
                >
                  <Plus className="w-4 h-4" />
                  РЎРѕР·РґР°С‚СЊ РїР°РїРєСѓ
                </button>
              </div>

              {loadingFolders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3390ec]" />
                </div>
              ) : folders.length === 0 ? (
                <div className="px-5 py-12 text-center text-[#8e8e93]">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-[15px]">РџР°РїРѕРє РїРѕРєР° РЅРµС‚</p>
                  <p className="text-[13px] mt-1">РЎРѕР·РґР°Р№С‚Рµ РїРµСЂРІСѓСЋ РїР°РїРєСѓ, С‡С‚РѕР±С‹ РіСЂСѓРїРїРёСЂРѕРІР°С‚СЊ С‡Р°С‚С‹.</p>
                </div>
              ) : (
                <div className="px-5 pb-5 space-y-3">
                  {folders.map((folder) => (
                    <div key={folder.id} className="rounded-2xl bg-[#efeff4] dark:bg-[#202b36] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: folder.color || '#3390ec' }}>
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[15px] font-medium text-[#222] dark:text-[#e1e1e1] truncate">{folder.name}</p>
                            <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">
                              {(folder.chatSettings || []).length} С‡Р°С‚РѕРІ
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenEditFolder(folder)} className="p-2 text-[#3390ec] hover:bg-white/60 dark:hover:bg-[#17212b] rounded-full transition" aria-label="Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РїР°РїРєСѓ">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteFolder(folder.id)} className="p-2 text-[#ef5350] hover:bg-white/60 dark:hover:bg-[#17212b] rounded-full transition" aria-label="РЈРґР°Р»РёС‚СЊ РїР°РїРєСѓ">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {(folder.chatSettings || []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(folder.chatSettings || []).slice(0, 6).map((item, index) => (
                            <span key={`${folder.id}-${item.chat?.id || index}`} className="px-2.5 py-1 rounded-full bg-white dark:bg-[#17212b] text-[12px] text-[#5b6470] dark:text-[#c3d0db]">
                              {item.chat?.name || 'Р‘РµР· РЅР°Р·РІР°РЅРёСЏ'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {section === 'bots' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Р‘РѕС‚С‹ Рё РёРЅС‚РµРіСЂР°С†РёРё" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b] p-5">
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { id: 'internal' as const, label: 'Р’СЃС‚СЂРѕРµРЅРЅС‹Рµ' },
                  { id: 'telegram' as const, label: 'Telegram' },
                  { id: 'n8n' as const, label: 'n8n' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setIntegrationTab(tab.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      integrationTab === tab.id
                        ? 'bg-[#3390ec] text-white'
                        : 'bg-[#efeff4] dark:bg-[#202b36] text-[#5b6470] dark:text-[#c3d0db]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Suspense fallback={<div className="text-center py-8 text-[#8e8e93]">Р—Р°РіСЂСѓР·РєР°...</div>}>
                {integrationTab === 'internal' && <LazyBotManager />}
                {integrationTab === 'telegram' && <LazyBotSettings embedded />}
                {integrationTab === 'n8n' && <LazyN8nSettings embedded />}
              </Suspense>
            </div>
          </div>
        )}

        {false && section === 'chat-settings' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="РќР°СЃС‚СЂРѕР№РєРё С‡Р°С‚РѕРІ" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b] flex items-center justify-center text-[#8e8e93]">
              <p>РЎРєРѕСЂРѕ...</p>
            </div>
          </div>
        )}

        {/* в”Ђв”Ђ BOTS в”Ђв”Ђ */}
        {false && section === 'bots' && (
          <div className="flex flex-col h-full">
            <SectionHeader title="Р‘РѕС‚С‹" />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b] p-5">
              <Suspense fallback={<div className="text-center py-8 text-[#8e8e93]">Р—Р°РіСЂСѓР·РєР°...</div>}>
                <LazyBotManager />
              </Suspense>
            </div>
          </div>
        )}

        {/* в”Ђв”Ђ 2FA Modal в”Ђв”Ђ */}
        {show2FAModal && (
          <Suspense fallback={<div>Р—Р°РіСЂСѓР·РєР°...</div>}>
            <LazyTwoFactorAuth
              onClose={() => {
                setShow2FAModal(false);
                loadSecurityStatus();
              }}
            />
          </Suspense>
        )}
        {showArchivedChats && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/30 z-50" />}>
            <LazyArchivedChats onClose={() => setShowArchivedChats(false)} onSelectChat={() => setShowArchivedChats(false)} />
          </Suspense>
        )}
        {showBlockedUsers && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/30 z-50" />}>
            <LazyBlockedUsers onClose={() => setShowBlockedUsers(false)} />
          </Suspense>
        )}
        {showFolderModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#17212b] shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#202c33]">
                <h3 className="text-[17px] font-semibold text-[#222] dark:text-white">
                  {editingFolder ? 'Edit Folder' : 'New Folder'}
                </h3>
                <button
                  onClick={() => {
                    setShowFolderModal(false);
                    resetFolderForm();
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#202b36]"
                >
                  <X className="w-4 h-4 text-[#8e8e93]" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#8e8e93] mb-2">Name</label>
                  <input
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="For example, Work"
                    className="w-full px-4 py-3 bg-[#efeff4] dark:bg-[#202b36] rounded-xl text-[15px] text-[#222] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#8e8e93] mb-2">Color</label>
                  <input
                    type="color"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="w-full h-12 p-1 bg-[#efeff4] dark:bg-[#202b36] rounded-xl cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleSaveFolder}
                  className="w-full py-3 bg-[#3390ec] text-white rounded-xl font-medium hover:bg-[#2b7fd4] transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UserSettings;
