import React, { useEffect, useState } from 'react';
import { telegramService } from '../services/telegramService';

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

  useEffect(() => {
    // Проверить, что приложение запущено внутри Telegram
    if (!window.Telegram?.WebApp) {
      setError('Это приложение должно быть запущено внутри Telegram');
      setLoading(false);
      return;
    }

    const telegram = window.Telegram.WebApp;
    setTg(telegram);

    // Инициализировать приложение
    telegram.ready();
    telegram.expand();

    // Установить цвета темы
    telegram.setHeaderColor('#1e40af');
    telegram.setBackgroundColor('#ffffff');

    // Получить данные пользователя
    initUser(telegram);
  }, []);

  const initUser = async (telegram: any) => {
    try {
      const initData = telegram.initData;
      const initDataUnsafe = telegram.initDataUnsafe;

      if (!initData || !initDataUnsafe.user) {
        throw new Error('Не удалось получить данные пользователя');
      }

      // Аутентифицировать пользователя через API
      const response = await telegramService.initMiniApp(initData, initDataUnsafe);
      
      setUser(response.user);
      
      // Показать главную кнопку
      telegram.MainButton.text = 'Открыть чаты';
      telegram.MainButton.show();
      telegram.MainButton.onClick(() => {
        // Перейти к чатам
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
    if (tg) {
      tg.sendData(JSON.stringify({ action: 'open_chat', chatId }));
      tg.close();
    }
  };

  const handleShowSettings = () => {
    if (tg) {
      tg.showPopup({
        title: 'Настройки',
        message: 'Откройте веб-версию для полного доступа к настройкам',
        buttons: [
          { id: 'open', type: 'default', text: 'Открыть' },
          { id: 'cancel', type: 'cancel' }
        ]
      }, (buttonId: string) => {
        if (buttonId === 'open') {
          tg.openLink(window.location.origin);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Ошибка</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Заголовок */}
      <div className="bg-blue-700 text-white p-6 shadow-lg">
        <div className="flex items-center space-x-4">
          {user?.avatar && (
            <img 
              src={user.avatar} 
              alt="Avatar" 
              className="w-16 h-16 rounded-full border-2 border-white"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">Stogram</h1>
            <p className="text-blue-100">
              Привет, {user?.displayName || user?.username}!
            </p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="p-4 space-y-4">
        {/* Быстрые действия */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleOpenChat('new')}
              className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <div className="text-2xl mb-1">💬</div>
              <div className="text-sm">Новый чат</div>
            </button>
            
            <button 
              onClick={handleShowSettings}
              className="p-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-sm">Настройки</div>
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Ваша активность</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-xs text-gray-600">Чаты</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-xs text-gray-600">Сообщения</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-xs text-gray-600">Контакты</div>
            </div>
          </div>
        </div>

        {/* Информация о интеграции */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            🔗 Telegram интеграция активна
          </h3>
          <p className="text-sm text-blue-700">
            Все уведомления и сообщения синхронизируются автоматически.
          </p>
        </div>

        {/* Функции Mini App */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Доступные функции</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Отправка и получение сообщений</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Push-уведомления</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Синхронизация чатов</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Обмен файлами</span>
            </li>
          </ul>
        </div>

        {/* Кнопка открытия полной версии */}
        <button
          onClick={() => tg?.openLink(window.location.origin)}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition"
        >
          Открыть полную версию
        </button>
      </div>
    </div>
  );
};

export default TelegramMiniApp;
