import React, { useEffect, useState } from 'react';
import { telegramService } from '../services/telegramService';
import { getMediaUrl } from '../utils/helpers';
import { useThemeStore } from '../store/themeStore';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const TelegramMiniApp: React.FC = () => {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { effectiveTheme } = useThemeStore();

  useEffect(() => {
    if (!window.Telegram?.WebApp) {
      setError('Это приложение должно быть запущено внутри Telegram');
      setLoading(false);
      return;
    }

    const telegram = window.Telegram.WebApp;
    setTg(telegram);

    telegram.ready();
    telegram.expand();
    telegram.setHeaderColor(effectiveTheme === 'dark' ? '#17212b' : '#1e40af');
    telegram.setBackgroundColor(effectiveTheme === 'dark' ? '#0b141a' : '#f8fafc');

    void initUser(telegram);
  }, [effectiveTheme]);

  const initUser = async (telegram: any) => {
    try {
      const initData = telegram.initData;
      const initDataUnsafe = telegram.initDataUnsafe;

      if (!initData || !initDataUnsafe.user) {
        throw new Error('Не удалось получить данные пользователя');
      }

      const response = await telegramService.initMiniApp(initData, initDataUnsafe);
      setUser(response.user);

      telegram.MainButton.text = 'Открыть чаты';
      telegram.MainButton.show();
      telegram.MainButton.onClick(() => {
        window.location.hash = '/chats';
      });
    } catch (err: any) {
      console.error('Init error:', err);
      setError(err.message || 'Ошибка инициализации');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (chatId: string) => {
    if (!tg) {
      return;
    }

    tg.sendData(JSON.stringify({ action: 'open_chat', chatId }));
    tg.close();
  };

  const handleShowSettings = () => {
    if (!tg) {
      return;
    }

    tg.showPopup(
      {
        title: 'Настройки',
        message: 'Откройте веб-версию для полного доступа к настройкам',
        buttons: [
          { id: 'open', type: 'default', text: 'Открыть' },
          { id: 'cancel', type: 'cancel' },
        ],
      },
      (buttonId: string) => {
        if (buttonId === 'open') {
          tg.openLink(window.location.origin);
        }
      },
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0b141a]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#3390ec]" />
          <p className="text-slate-600 dark:text-slate-300">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0b141a]">
        <div className="max-w-md px-4 text-center">
          <div className="mb-4 text-5xl text-red-500">!</div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Ошибка</h2>
          <p className="text-slate-600 dark:text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 dark:bg-[#0b141a] dark:text-white">
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3390ec] p-6 text-white shadow-lg dark:from-[#17212b] dark:to-[#203647]">
        <div className="flex items-center gap-4">
          {user?.avatar && (
            <img
              src={getMediaUrl(user.avatar) || ''}
              alt="Avatar"
              className="h-16 w-16 rounded-full border-2 border-white object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">Stogram</h1>
            <p className="text-blue-100">Привет, {user?.displayName || user?.username}!</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#17212b] dark:shadow-none">
          <h2 className="mb-3 text-lg font-semibold">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOpenChat('new')}
              className="rounded-xl bg-[#3390ec] p-4 text-white transition hover:bg-[#2b7fd1]"
            >
              <div className="mb-1 text-2xl">+</div>
              <div className="text-sm">Новый чат</div>
            </button>

            <button
              onClick={handleShowSettings}
              className="rounded-xl bg-slate-200 p-4 text-slate-700 transition hover:bg-slate-300 dark:bg-[#202b36] dark:text-slate-200 dark:hover:bg-[#2a3947]"
            >
              <div className="mb-1 text-2xl">⚙</div>
              <div className="text-sm">Настройки</div>
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#17212b] dark:shadow-none">
          <h2 className="mb-3 text-lg font-semibold">Ваша активность</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#3390ec]">0</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Чаты</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-500">0</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Сообщения</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-violet-500">0</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Контакты</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#3390ec]/20 bg-[#3390ec]/5 p-4 dark:border-[#3390ec]/30 dark:bg-[#17263a]">
          <h3 className="mb-2 font-semibold text-[#1d4ed8] dark:text-[#7dc1ff]">
            Telegram интеграция активна
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Все уведомления и сообщения синхронизируются автоматически.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#17212b] dark:shadow-none">
          <h2 className="mb-3 text-lg font-semibold">Доступные функции</h2>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              <span>Отправка и получение сообщений</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              <span>Push-уведомления</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              <span>Синхронизация чатов</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              <span>Обмен файлами</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => tg?.openLink(window.location.origin)}
          className="w-full rounded-xl bg-gradient-to-r from-[#3390ec] to-violet-600 py-3 font-semibold text-white transition hover:from-[#2b7fd1] hover:to-violet-700"
        >
          Открыть полную версию
        </button>
      </div>
    </div>
  );
};
