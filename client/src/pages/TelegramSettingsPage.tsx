import React, { useEffect, useState } from 'react';
import { useConfirm } from '../components/confirm/ConfirmDialogProvider';
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
  const confirm = useConfirm();
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [syncMessages, setSyncMessages] = useState(false);
  const [syncProfile, setSyncProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadSettings();
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
    const shouldUnlink = await confirm({
      title: 'Отвязать Telegram',
      message: 'Вы уверены, что хотите отвязать Telegram-аккаунт?',
      confirmText: 'Отвязать',
      tone: 'danger',
    });

    if (!shouldUnlink) {
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
        syncProfile,
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
      alert('Тестовое уведомление отправлено. Проверьте Telegram.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Не удалось отправить тестовое уведомление');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f7fb] dark:bg-[#0b141a]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#3390ec]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-[#1f2937] dark:bg-[#0b141a] dark:text-[#e6edf3]">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Настройки Telegram</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Управление связкой аккаунта, уведомлениями и синхронизацией.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#202c33] dark:bg-[#17212b]">
          <h2 className="mb-4 text-xl font-semibold">Статус подключения</h2>

          {settings?.linked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {settings.telegram?.photoUrl && (
                  <img
                    src={settings.telegram.photoUrl}
                    alt="Telegram avatar"
                    className="h-16 w-16 rounded-full border border-slate-200 object-cover dark:border-[#24323d]"
                  />
                )}
                <div>
                  <p className="font-semibold">
                    {settings.telegram?.firstName} {settings.telegram?.lastName}
                  </p>
                  {settings.telegram?.username && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{settings.telegram.username}</p>
                  )}
                  <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    Аккаунт успешно связан
                  </p>
                </div>
              </div>

              <button
                onClick={handleUnlink}
                className="rounded-xl bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
              >
                Отвязать аккаунт
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                Свяжите свой Telegram аккаунт, чтобы получать уведомления и использовать интеграцию с ботом.
              </p>

              {settings?.botInfo.username && <div id="telegram-login-container" className="flex justify-start" />}

              <p className="text-sm text-slate-500 dark:text-slate-400">
                После авторизации вы автоматически вернётесь обратно в приложение.
              </p>
            </div>
          )}
        </section>

        {settings?.linked && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#202c33] dark:bg-[#17212b]">
              <h2 className="mb-4 text-xl font-semibold">Настройки интеграции</h2>

              <div className="space-y-5">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(event) => setNotifications(event.target.checked)}
                    className="mt-1 h-5 w-5 rounded text-[#3390ec]"
                  />
                  <div>
                    <p className="font-medium">Уведомления в Telegram</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Получать уведомления о новых сообщениях через Telegram бота.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={syncMessages}
                    onChange={(event) => setSyncMessages(event.target.checked)}
                    className="mt-1 h-5 w-5 rounded text-[#3390ec]"
                  />
                  <div>
                    <p className="font-medium">Синхронизация сообщений</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Синхронизировать сообщения между Stogram и Telegram.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={syncProfile}
                    onChange={(event) => setSyncProfile(event.target.checked)}
                    className="mt-1 h-5 w-5 rounded text-[#3390ec]"
                  />
                  <div>
                    <p className="font-medium">Синхронизация профиля</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Автоматически обновлять имя и фото профиля из Telegram.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="rounded-xl bg-[#3390ec] px-6 py-2 text-white transition hover:bg-[#2b7fd1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Сохранение...' : 'Сохранить настройки'}
                </button>

                {notifications && (
                  <button
                    onClick={handleTestNotification}
                    className="rounded-xl bg-slate-200 px-6 py-2 text-slate-700 transition hover:bg-slate-300 dark:bg-[#202b36] dark:text-slate-200 dark:hover:bg-[#293744]"
                  >
                    Тестовое уведомление
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#202c33] dark:bg-[#17212b]">
              <h2 className="mb-4 text-xl font-semibold">Мосты для чатов</h2>

              {settings.telegram?.bridges && settings.telegram.bridges.length > 0 ? (
                <div className="space-y-3">
                  {settings.telegram.bridges.map((bridge: any) => (
                    <div
                      key={bridge.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-[#24323d] dark:bg-[#111922]"
                    >
                      <div>
                        <p className="font-medium">Чат синхронизирован</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Направление: {bridge.syncDirection}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Последняя синхронизация: {new Date(bridge.lastSyncAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          /* TODO */
                        }}
                        className="rounded-xl bg-red-50 px-4 py-2 text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-5 py-6 text-center dark:bg-[#111922]">
                  <p className="mb-2 text-slate-600 dark:text-slate-300">
                    У вас пока нет активных мостов для чатов.
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Мосты позволяют автоматически синхронизировать сообщения между Telegram и Stogram.
                  </p>
                </div>
              )}
            </section>

            {settings.botInfo.username && (
              <section className="rounded-3xl border border-[#3390ec]/20 bg-[#3390ec]/5 p-6 dark:border-[#3390ec]/30 dark:bg-[#17263a]">
                <h2 className="mb-2 text-xl font-semibold">Telegram Bot</h2>
                <p className="mb-4 text-slate-700 dark:text-slate-300">
                  Для управления интеграцией через Telegram откройте бота:
                </p>
                <a
                  href={`https://t.me/${settings.botInfo.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl bg-[#3390ec] px-6 py-3 font-medium text-white transition hover:bg-[#2b7fd1]"
                >
                  Открыть @{settings.botInfo.username}
                </a>

                <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  <p className="mb-2 font-medium">Доступные команды:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>/start - начать работу с ботом</li>
                    <li>/status - проверить статус аккаунта</li>
                    <li>/notifications on|off - управление уведомлениями</li>
                    <li>/bridge - информация о мостах для чатов</li>
                    <li>/help - показать справку</li>
                  </ul>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
