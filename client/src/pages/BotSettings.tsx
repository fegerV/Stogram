import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { telegramBotApi } from '../services/api';

const DEFAULT_COMMANDS = [
  { command: 'start', description: 'Запустить бота' },
  { command: 'help', description: 'Показать справку' },
  { command: 'status', description: 'Проверить статус аккаунта' },
  { command: 'chats', description: 'Показать список чатов' },
  { command: 'unread', description: 'Показать непрочитанные сообщения' },
  { command: 'search', description: 'Поиск по сообщениям' },
  { command: 'notify', description: 'Управление уведомлениями' },
  { command: 'connect', description: 'Подключить аккаунт Stogram' },
  { command: 'disconnect', description: 'Отключить аккаунт' },
];

interface BotSettingsProps {
  embedded?: boolean;
}

export default function BotSettings({ embedded = false }: BotSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [config, setConfig] = useState({
    botUsername: '',
    webhookUrl: '',
    commands: DEFAULT_COMMANDS,
    notifications: true,
    enabled: false,
  });
  const [botTokenInput, setBotTokenInput] = useState('');
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [tokenDirty, setTokenDirty] = useState(false);
  const [stats, setStats] = useState({
    authorizedUsers: 0,
    totalMessages: 0,
    enabled: false,
    botUsername: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [botInfo, setBotInfo] = useState<any>(null);

  useEffect(() => {
    void loadConfig();
    void loadStats();
    void loadUsers();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await telegramBotApi.getConfig();
      const data = response.data;
      setAccessDenied(false);
      setConfig({
        botUsername: data.botUsername || '',
        webhookUrl: data.webhookUrl || '',
        commands: data.commands || DEFAULT_COMMANDS,
        notifications: data.notifications ?? true,
        enabled: data.enabled ?? false,
      });
      setBotTokenInput('');
      setTokenDirty(false);
      setHasSavedToken(Boolean(data.hasBotToken || data.botToken));
    } catch (error) {
      console.error('Failed to load config:', error);
      if ((error as any)?.response?.status === 403) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await telegramBotApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      if ((error as any)?.response?.status === 403) {
        setAccessDenied(true);
      }
    }
  };

  const loadUsers = async () => {
    try {
      const response = await telegramBotApi.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      if ((error as any)?.response?.status === 403) {
        setAccessDenied(true);
      }
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const nextBotToken = botTokenInput.trim();
      if (config.enabled && !hasSavedToken && !nextBotToken) {
        toast.error('Введите токен бота перед включением интеграции');
        return;
      }

      await telegramBotApi.saveConfig({
        ...config,
        ...(tokenDirty && nextBotToken ? { botToken: nextBotToken } : {}),
      });

      if (tokenDirty && nextBotToken) {
        setHasSavedToken(true);
      }

      setBotTokenInput('');
      setTokenDirty(false);
      toast.success('Настройки сохранены');
      await Promise.all([loadConfig(), loadStats(), loadUsers()]);
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const tokenToTest = botTokenInput.trim();
    if (!tokenToTest && !hasSavedToken) {
      toast.error('Введите токен бота');
      return;
    }

    setTesting(true);
    try {
      const response = await telegramBotApi.testConnection(tokenToTest);
      const data = response.data;
      if (data.success) {
        setBotInfo(data.bot);
        setConfig((prev) => ({ ...prev, botUsername: data.bot.username }));
        toast.success(`Подключено к @${data.bot.username}`);
      } else {
        toast.error(data.error || 'Не удалось подключить бота');
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      toast.error('Не удалось подключить бота');
    } finally {
      setTesting(false);
    }
  };

  const handleBroadcast = async () => {
    const message = prompt('Введите текст рассылки:');
    if (!message) return;

    try {
      const response = await telegramBotApi.broadcast(message);
      const data = response.data;
      if (data.success) {
        toast.success(`Сообщение отправлено ${data.usersNotified} пользователям`);
      } else {
        toast.error('Не удалось отправить рассылку');
      }
    } catch (error) {
      console.error('Failed to broadcast:', error);
      toast.error('Не удалось отправить рассылку');
    }
  };

  const handleCommandChange = (index: number, field: string, value: string) => {
    const nextCommands = [...config.commands];
    nextCommands[index] = { ...nextCommands[index], [field]: value };
    setConfig((prev) => ({ ...prev, commands: nextCommands }));
  };

  const handleAddCommand = () => {
    setConfig((prev) => ({
      ...prev,
      commands: [...prev.commands, { command: '', description: '' }],
    }));
  };

  const handleRemoveCommand = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      commands: prev.commands.filter((_, commandIndex) => commandIndex !== index),
    }));
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[240px]' : 'min-h-screen'}`}>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#00a884]" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className={embedded ? '' : 'min-h-screen bg-gray-100 p-6 dark:bg-gray-900'}>
        <div className={`${embedded ? '' : 'mx-auto max-w-4xl'} rounded-lg bg-white p-6 shadow dark:bg-gray-800`}>
          <h1 className={`mb-2 font-bold text-gray-900 dark:text-white ${embedded ? 'text-xl' : 'text-2xl'}`}>
            Настройки Telegram-бота
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Этот раздел доступен только администраторам. Добавьте своего пользователя в `ADMIN_USER_IDS`
            на сервере, чтобы управлять интеграцией Telegram-бота.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-100 p-6 dark:bg-gray-900'}>
      <div className={embedded ? '' : 'mx-auto max-w-4xl'}>
        <h1 className={`mb-6 font-bold text-gray-900 dark:text-white ${embedded ? 'text-xl' : 'text-2xl'}`}>
          Настройки Telegram-бота
        </h1>

        {botInfo && (
          <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl">🤖</div>
              <div>
                <h2 className="text-xl font-bold">@{botInfo.username}</h2>
                <p className="text-blue-100">{botInfo.firstName}</p>
                <p className="text-sm text-blue-200">ID: {botInfo.id}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Авторизованные пользователи</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.authorizedUsers}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Всего сообщений</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMessages}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Статус</p>
            <p className={`text-2xl font-bold ${stats.enabled ? 'text-green-600' : 'text-gray-400'}`}>
              {stats.enabled ? 'Активен' : 'Выключен'}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Конфигурация бота</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Токен бота</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={botTokenInput}
                  onChange={(event) => {
                    setBotTokenInput(event.target.value);
                    setTokenDirty(true);
                  }}
                  placeholder={
                    hasSavedToken
                      ? 'Сохранённый токен уже настроен. Введите новый токен только если хотите его заменить'
                      : 'Введите токен Telegram-бота'
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testing || (!botTokenInput.trim() && !hasSavedToken)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {testing ? 'Проверка...' : 'Проверить'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {hasSavedToken
                  ? 'Токен уже сохранён. Оставьте поле пустым, чтобы сохранить его, или вставьте новый токен для замены.'
                  : 'Получите токен у @BotFather в Telegram'}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Webhook URL (необязательно)
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(event) => setConfig((prev) => ({ ...prev, webhookUrl: event.target.value }))}
                placeholder="https://your-server.com/api/telegram-bot/webhook"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">Оставьте пустым для режима long polling</p>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notifications}
                  onChange={(event) => setConfig((prev) => ({ ...prev, notifications: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#00a884] focus:ring-[#00a884]"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Включить уведомления</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(event) => setConfig((prev) => ({ ...prev, enabled: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#00a884] focus:ring-[#00a884]"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Включить бота</span>
              </label>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="rounded-lg bg-[#00a884] px-4 py-2 text-white hover:bg-[#008f6d] disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Команды бота</h2>
            <button
              onClick={handleAddCommand}
              className="rounded bg-[#00a884] px-3 py-1 text-sm text-white hover:bg-[#008f6d]"
            >
              Добавить команду
            </button>
          </div>

          <div className="space-y-3">
            {config.commands.map((command, index) => (
              <div key={`${command.command}-${index}`} className="flex items-center gap-3">
                <input
                  type="text"
                  value={command.command}
                  onChange={(event) => handleCommandChange(index, 'command', event.target.value)}
                  placeholder="команда"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={command.description}
                  onChange={(event) => handleCommandChange(index, 'description', event.target.value)}
                  placeholder="Описание"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => handleRemoveCommand(index)}
                  className="rounded px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Авторизованные пользователи</h2>
            <button
              onClick={handleBroadcast}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Рассылка
            </button>
          </div>

          {users.length === 0 ? (
            <p className="py-8 text-center text-gray-500 dark:text-gray-400">Пока нет авторизованных пользователей</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username} • Telegram ID: {user.telegramId}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Подключён: {new Date(user.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
