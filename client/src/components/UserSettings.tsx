import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { usePerformanceMonitor } from '../utils/performance';
import { monitoredApi } from '../utils/monitoredApi';
import { User, Bell, Shield, Palette, Bot, Webhook, Monitor, HardDrive, Download, Upload, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../utils/pushNotifications';

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

const UserSettings: React.FC<UserSettingsProps> = ({ onClose }) => {
  const { startRender, trackInteraction } = usePerformanceMonitor('UserSettings');
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications' | 'appearance' | 'bots' | 'sessions' | 'data'>('profile');
  const [user, setUser] = useState<any>(null);
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showProfilePhoto: true,
    showLastSeen: true
  });
  const [notifications, setNotifications] = useState({
    notificationsPush: true,
    notificationsEmail: true,
    notificationsSound: true,
    notificationsVibration: true
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const updateNotificationsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startRender();
    trackInteraction('settings_open', 'UserSettings');
    loadUserData();
    loadPrivacySettings();
    loadNotificationPreferences();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await monitoredApi.get('/users/me');
      setUser(response.data);
      trackInteraction('user_data_loaded', 'UserSettings');
    } catch (error) {
      console.error('Failed to load user data:', error);
      trackInteraction('user_data_error', 'UserSettings');
    }
  };

  const loadPrivacySettings = async () => {
    try {
      const response = await monitoredApi.get('/users/privacy');
      setPrivacy(response.data);
      trackInteraction('privacy_loaded', 'UserSettings');
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      trackInteraction('privacy_error', 'UserSettings');
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const response = await monitoredApi.get('/users/notifications');
      setNotifications(response.data);
      trackInteraction('notifications_loaded', 'UserSettings');
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      trackInteraction('notifications_error', 'UserSettings');
    }
  };

  const handlePrivacyChange = async (key: string, value: boolean) => {
    try {
      const newPrivacy = { ...privacy, [key]: value };
      await monitoredApi.put('/users/privacy', newPrivacy);
      setPrivacy(newPrivacy);
      trackInteraction('privacy_updated', 'UserSettings');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      trackInteraction('privacy_update_error', 'UserSettings');
    }
  };

  const debouncedUpdateNotifications = useCallback((prefs: typeof notifications) => {
    if (updateNotificationsTimeoutRef.current) {
      clearTimeout(updateNotificationsTimeoutRef.current);
    }

    updateNotificationsTimeoutRef.current = setTimeout(async () => {
      try {
        await monitoredApi.patch('/users/notifications', prefs);
        trackInteraction('notifications_updated', 'UserSettings');
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
        toast.error('Failed to update notification preferences');
        trackInteraction('notifications_update_error', 'UserSettings');
      }
    }, 500);
  }, [trackInteraction]);

  const handleNotificationChange = async (key: keyof typeof notifications, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);

    if (key === 'notificationsPush') {
      try {
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (value && vapidKey) {
          await subscribeToPushNotifications(vapidKey);
          toast.success('Push notifications enabled');
        } else if (!value) {
          await unsubscribeFromPushNotifications();
          toast.success('Push notifications disabled');
        }
      } catch (error) {
        console.error('Failed to update push notification subscription:', error);
        toast.error('Failed to update push notifications');
      }
    }

    debouncedUpdateNotifications(newNotifications);
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await monitoredApi.get('/users/sessions');
      setSessions(response.data.sessions);
      trackInteraction('sessions_loaded', 'UserSettings');
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
      trackInteraction('sessions_error', 'UserSettings');
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadStorageInfo = async () => {
    setLoadingStorage(true);
    try {
      const response = await monitoredApi.get('/users/storage');
      setStorageInfo(response.data);
      trackInteraction('storage_loaded', 'UserSettings');
    } catch (error) {
      console.error('Failed to load storage info:', error);
      toast.error('Failed to load storage information');
      trackInteraction('storage_error', 'UserSettings');
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await monitoredApi.delete(`/users/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Session revoked successfully');
      trackInteraction('session_revoked', 'UserSettings');
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to log out from all other devices?')) return;
    
    try {
      await monitoredApi.delete('/users/sessions');
      await loadSessions();
      toast.success('All other sessions revoked');
      trackInteraction('all_sessions_revoked', 'UserSettings');
    } catch (error) {
      console.error('Failed to revoke sessions:', error);
      toast.error('Failed to revoke sessions');
    }
  };

  const handleClearCache = async () => {
    if (!confirm('This will clear cached messages and temporary files. Continue?')) return;
    
    try {
      await monitoredApi.post('/users/storage/clear-cache');
      await loadStorageInfo();
      toast.success('Cache cleared successfully');
      trackInteraction('cache_cleared', 'UserSettings');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await monitoredApi.get('/users/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stogram-export-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data exported successfully');
      trackInteraction('data_exported', 'UserSettings');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      await monitoredApi.post('/users/import', data);
      toast.success('Data imported successfully');
      trackInteraction('data_imported', 'UserSettings');
      await loadUserData();
    } catch (error) {
      console.error('Failed to import data:', error);
      toast.error('Failed to import data');
    }
    
    event.target.value = '';
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    } else if (activeTab === 'data') {
      loadStorageInfo();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'privacy', label: 'Приватность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'sessions', label: 'Активные сеансы', icon: Monitor },
    { id: 'data', label: 'Данные и хранилище', icon: HardDrive },
    { id: 'bots', label: 'Боты', icon: Bot }
  ];

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        trackInteraction('settings_error', 'UserSettings');
        console.error('UserSettings error:', error, errorInfo);
      }}
    >
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Профиль</h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Изменить фото
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Отображаемое имя
                    </label>
                    <input
                      type="text"
                      value={user?.displayName || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      О себе
                    </label>
                    <textarea
                      value={user?.bio || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Приватность</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Показывать статус онлайн</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Другие пользователи смогут видеть, когда вы онлайн
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.showOnlineStatus}
                        onChange={(e) => handlePrivacyChange('showOnlineStatus', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Показывать время последнего посещения</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Когда вы были в сети в последний раз
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.showLastSeen}
                        onChange={(e) => handlePrivacyChange('showLastSeen', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Показывать фото профиля</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Другие пользователи смогут видеть вашу фотографию
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.showProfilePhoto}
                        onChange={(e) => handlePrivacyChange('showProfilePhoto', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Уведомления</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Push-уведомления</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Получать уведомления о новых сообщениях
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notifications.notificationsPush}
                        onChange={(e) => handleNotificationChange('notificationsPush', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email-уведомления</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Получать уведомления на электронную почту
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notifications.notificationsEmail}
                        onChange={(e) => handleNotificationChange('notificationsEmail', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Звук уведомлений</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Проигрывать звук при получении сообщения
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notifications.notificationsSound}
                        onChange={(e) => handleNotificationChange('notificationsSound', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Вибрация</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Вибрировать при получении уведомления
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notifications.notificationsVibration}
                        onChange={(e) => handleNotificationChange('notificationsVibration', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Внешний вид</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Тема
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button className="p-4 border-2 border-blue-600 rounded-lg bg-white">
                        <div className="w-full h-20 bg-white border border-gray-200 rounded mb-2"></div>
                        <p className="text-sm font-medium">Светлая</p>
                      </button>
                      <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600">
                        <div className="w-full h-20 bg-gray-800 rounded mb-2"></div>
                        <p className="text-sm font-medium">Темная</p>
                      </button>
                      <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600">
                        <div className="w-full h-20 bg-gradient-to-br from-white to-gray-800 rounded mb-2"></div>
                        <p className="text-sm font-medium">Авто</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Активные сеансы</h3>
                  {sessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllSessions}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      Завершить все другие сеансы
                    </button>
                  )}
                </div>

                {loadingSessions ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Нет активных сеансов</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Monitor className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {session.device || 'Unknown Device'}
                              </p>
                              {session.isCurrent && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                  Текущий
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {session.ipAddress}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Последняя активность: {new Date(session.lastActive).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Завершить сеанс"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Данные и хранилище</h3>

                {loadingStorage ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>
                  </div>
                ) : storageInfo ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Общее использование
                        </h4>
                        <HardDrive className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {storageInfo.total.formatted}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Приблизительная оценка
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Сообщения</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {storageInfo.messages.count}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Медиафайлы</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {storageInfo.media.count}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Контакты</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {storageInfo.contacts.count}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Чаты</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {storageInfo.chats.count}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleClearCache}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Trash2 className="w-5 h-5 text-orange-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Очистить кэш</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Удалить временные файлы и кэшированные данные
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleExportData}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-blue-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Экспорт данных</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Скачать копию ваших данных в формате JSON
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Upload className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">Импорт данных</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Восстановить данные из ранее экспортированного файла
                            </p>
                          </div>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'bots' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Боты и интеграции</h3>
                <div className="space-y-4">
                  <a
                    href="/bots"
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Управление ботами</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Создавайте и управляйте своими ботами
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>

                  <a
                    href="/webhooks"
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Webhook className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Вебхуки</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Настройте вебхуки для интеграции с внешними сервисами
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
};

export default UserSettings;
