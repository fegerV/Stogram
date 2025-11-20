import React, { useEffect, useState } from 'react';
import { telegramService } from '../services/telegramService';

interface TelegramSettings {
  linked: boolean;
  telegram: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    notifications: boolean;
    syncMessages: boolean;
    syncProfile: boolean;
    bridges: any[];
  } | null;
  botInfo: {
    username?: string;
    isInitialized: boolean;
  };
}

export const TelegramSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [syncMessages, setSyncMessages] = useState(false);
  const [syncProfile, setSyncProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await telegramService.getSettings();
      setSettings(data);
      if (data.telegram) {
        setNotifications(data.telegram.notifications);
        setSyncMessages(data.telegram.syncMessages);
        setSyncProfile(data.telegram.syncProfile);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Вы уверены, что хотите отвязать Telegram аккаунт?')) {
      return;
    }

    try {
      await telegramService.unlinkAccount();
      await loadSettings();
      alert('Telegram аккаунт успешно отвязан');
    } catch (error) {
      console.error('Failed to unlink account:', error);
      alert('Не удалось отвязать аккаунт');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await telegramService.updateSettings({
        notifications,
        syncMessages,
        syncProfile
      });
      alert('Настройки сохранены');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await telegramService.sendTestNotification();
      alert('Тестовое уведомление отправлено! Проверьте Telegram.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Не удалось отправить тестовое уведомление');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Настройки Telegram</h1>

      {/* Статус подключения */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Статус подключения</h2>
        
        {settings?.linked ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {settings.telegram?.photoUrl && (
                <img 
                  src={settings.telegram.photoUrl} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold">
                  {settings.telegram?.firstName} {settings.telegram?.lastName}
                </p>
                {settings.telegram?.username && (
                  <p className="text-gray-600">@{settings.telegram.username}</p>
                )}
                <p className="text-sm text-green-600 mt-1">✓ Аккаунт связан</p>
              </div>
            </div>
            
            <button
              onClick={handleUnlink}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Отвязать аккаунт
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Свяжите свой Telegram аккаунт для получения уведомлений и доступа к дополнительным функциям.
            </p>
            
            {settings?.botInfo.username && (
              <div
                id="telegram-login-container"
                className="flex justify-start"
              />
            )}
            
            <p className="text-sm text-gray-500">
              После авторизации вы будете автоматически перенаправлены обратно.
            </p>
          </div>
        )}
      </div>

      {/* Настройки (только если аккаунт связан) */}
      {settings?.linked && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Настройки интеграции</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <p className="font-medium">Уведомления в Telegram</p>
                  <p className="text-sm text-gray-600">
                    Получать уведомления о новых сообщениях через Telegram бота
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={syncMessages}
                  onChange={(e) => setSyncMessages(e.target.checked)}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <p className="font-medium">Синхронизация сообщений</p>
                  <p className="text-sm text-gray-600">
                    Синхронизировать сообщения между Stogram и Telegram
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={syncProfile}
                  onChange={(e) => setSyncProfile(e.target.checked)}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <p className="font-medium">Синхронизация профиля</p>
                  <p className="text-sm text-gray-600">
                    Автоматически обновлять фото и имя из Telegram
                  </p>
                </div>
              </label>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить настройки'}
              </button>

              {notifications && (
                <button
                  onClick={handleTestNotification}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Тестовое уведомление
                </button>
              )}
            </div>
          </div>

          {/* Мосты для чатов */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Мосты для чатов</h2>
            
            {settings.telegram?.bridges && settings.telegram.bridges.length > 0 ? (
              <div className="space-y-3">
                {settings.telegram.bridges.map((bridge: any) => (
                  <div 
                    key={bridge.id}
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">Чат синхронизирован</p>
                      <p className="text-sm text-gray-600">
                        Направление: {bridge.syncDirection}
                      </p>
                      <p className="text-xs text-gray-500">
                        Последняя синхронизация: {new Date(bridge.lastSyncAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {/* TODO: implement delete bridge */}}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  У вас пока нет активных мостов для чатов
                </p>
                <p className="text-sm text-gray-500">
                  Мосты позволяют автоматически синхронизировать сообщения между Telegram и Stogram
                </p>
              </div>
            )}
          </div>

          {/* Информация о боте */}
          {settings.botInfo.username && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Telegram Bot</h2>
              <p className="text-gray-700 mb-4">
                Для управления настройками через Telegram, напишите боту:
              </p>
              <a
                href={`https://t.me/${settings.botInfo.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Открыть @{settings.botInfo.username}
              </a>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium mb-2">Доступные команды:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>/start - Начать работу с ботом</li>
                  <li>/status - Проверить статус аккаунта</li>
                  <li>/notifications on|off - Управление уведомлениями</li>
                  <li>/bridge - Информация о мостах для чатов</li>
                  <li>/help - Показать справку</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TelegramSettingsPage;
