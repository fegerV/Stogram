import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useConfirm } from '../components/confirm/ConfirmDialogProvider';
import { n8nApi } from '../services/api';

const AVAILABLE_EVENTS = [
  { value: 'new_message', label: 'Новое сообщение' },
  { value: 'new_chat', label: 'Создан новый чат' },
  { value: 'user_registered', label: 'Новый пользователь' },
  { value: 'call_started', label: 'Звонок начался' },
  { value: 'call_ended', label: 'Звонок завершён' },
  { value: 'message_updated', label: 'Сообщение изменено' },
  { value: 'message_deleted', label: 'Сообщение удалено' },
  { value: 'chat_updated', label: 'Чат обновлён' },
  { value: 'user_status_changed', label: 'Статус пользователя изменился' },
  { value: 'reaction_added', label: 'Добавлена реакция' },
  { value: 'member_joined', label: 'Участник присоединился' },
  { value: 'member_left', label: 'Участник вышел' },
];

interface N8nSettingsProps {
  embedded?: boolean;
}

export default function N8nSettings({ embedded = false }: N8nSettingsProps) {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [config, setConfig] = useState({
    webhookUrl: '',
    enabled: false,
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasSavedApiKey, setHasSavedApiKey] = useState(false);
  const [apiKeyDirty, setApiKeyDirty] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    webhookUrl: '',
    events: [] as string[],
    secret: '',
  });

  useEffect(() => {
    void loadConfig();
    void loadWebhooks();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await n8nApi.getConfig();
      const data = response.data;
      setAccessDenied(false);
      setConfig({
        webhookUrl: data.webhookUrl || '',
        enabled: data.enabled || false,
      });
      setApiKeyInput('');
      setApiKeyDirty(false);
      setHasSavedApiKey(Boolean(data.hasApiKey || data.apiKey));
    } catch (error) {
      console.error('Failed to load config:', error);
      if ((error as any)?.response?.status === 403) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadWebhooks = async () => {
    try {
      const response = await n8nApi.getWebhooks();
      setWebhooks(response.data.webhooks || []);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      if ((error as any)?.response?.status === 403) {
        setAccessDenied(true);
      }
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const nextApiKey = apiKeyInput.trim();
      await n8nApi.saveConfig({
        ...config,
        ...(apiKeyDirty && nextApiKey ? { apiKey: nextApiKey } : {}),
      });

      if (apiKeyDirty && nextApiKey) {
        setHasSavedApiKey(true);
      }

      setApiKeyInput('');
      setApiKeyDirty(false);
      toast.success('Настройки сохранены');
      await loadConfig();
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl) {
      toast.error('Введите webhook URL');
      return;
    }

    setTesting(true);
    try {
      const response = await n8nApi.testWebhook({
        webhookUrl: config.webhookUrl,
        apiKey: apiKeyInput.trim() || undefined,
      });
      const data = response.data;
      if (data.success) {
        toast.success('Тестовый webhook успешно отправлен');
      } else {
        toast.error(data.error || 'Не удалось отправить тестовый webhook');
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast.error('Не удалось отправить тестовый webhook');
    } finally {
      setTesting(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.webhookUrl || newWebhook.events.length === 0) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      await n8nApi.createWebhook(newWebhook);
      toast.success('Webhook успешно создан');
      setShowCreateModal(false);
      setNewWebhook({ name: '', webhookUrl: '', events: [], secret: '' });
      await loadWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast.error('Не удалось создать webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    const shouldDelete = await confirm({
      title: 'Удалить webhook',
      message: 'Вы уверены, что хотите удалить этот webhook?',
      confirmText: 'Удалить',
      tone: 'danger',
    });

    if (!shouldDelete) return;

    try {
      await n8nApi.deleteWebhook(id);
      toast.success('Webhook удалён');
      await loadWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast.error('Не удалось удалить webhook');
    }
  };

  const handleToggleWebhook = async (id: string, enabled: boolean) => {
    try {
      await n8nApi.updateWebhook(id, { enabled });
      toast.success(enabled ? 'Webhook включён' : 'Webhook выключен');
      await loadWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
      toast.error('Не удалось обновить webhook');
    }
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
            Настройки интеграции n8n
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Этот раздел доступен только администраторам. Добавьте своего пользователя в `ADMIN_USER_IDS`
            на сервере, чтобы управлять интеграцией с n8n.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-100 p-6 dark:bg-gray-900'}>
      <div className={embedded ? '' : 'mx-auto max-w-4xl'}>
        <h1 className={`mb-6 font-bold text-gray-900 dark:text-white ${embedded ? 'text-xl' : 'text-2xl'}`}>
          Настройки интеграции n8n
        </h1>

        <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Настройки подключения</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Webhook URL</label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(event) => setConfig((prev) => ({ ...prev, webhookUrl: event.target.value }))}
                placeholder="https://your-n8n-instance.com/webhook/..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">API-ключ</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(event) => {
                  setApiKeyInput(event.target.value);
                  setApiKeyDirty(true);
                }}
                placeholder={
                  hasSavedApiKey
                    ? 'Сохранённый API-ключ уже настроен. Введите новый ключ только если хотите его заменить'
                    : 'Введите API-ключ n8n'
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                {hasSavedApiKey
                  ? 'API-ключ уже сохранён. Оставьте поле пустым, чтобы сохранить его, или вставьте новый ключ для замены.'
                  : 'Необязательный Bearer-токен для защищённых вызовов webhook из n8n.'}
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={config.enabled}
                onChange={(event) => setConfig((prev) => ({ ...prev, enabled: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-[#00a884] focus:ring-[#00a884]"
              />
              <label htmlFor="enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Включить интеграцию n8n
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="rounded-lg bg-[#00a884] px-4 py-2 text-white hover:bg-[#008f6d] disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
              <button
                onClick={handleTestWebhook}
                disabled={testing || !config.webhookUrl}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {testing ? 'Проверка...' : 'Проверить подключение'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Webhook</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-[#00a884] px-4 py-2 text-white hover:bg-[#008f6d]"
            >
              Добавить webhook
            </button>
          </div>

          {webhooks.length === 0 ? (
            <p className="py-8 text-center text-gray-500 dark:text-gray-400">Пока нет настроенных webhook</p>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{webhook.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{webhook.webhookUrl}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {JSON.parse(webhook.events || '[]').map((event: string) => (
                          <span key={event} className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleWebhook(webhook.id, !webhook.enabled)}
                        className={`rounded px-3 py-1 text-sm ${
                          webhook.enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {webhook.enabled ? 'Включён' : 'Выключен'}
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Создать webhook</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(event) => setNewWebhook((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Мой webhook"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Webhook URL</label>
                  <input
                    type="url"
                    value={newWebhook.webhookUrl}
                    onChange={(event) => setNewWebhook((prev) => ({ ...prev, webhookUrl: event.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">События</label>
                  <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label key={event.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event.value)}
                          onChange={(checkboxEvent) => {
                            if (checkboxEvent.target.checked) {
                              setNewWebhook((prev) => ({
                                ...prev,
                                events: [...prev.events, event.value],
                              }));
                            } else {
                              setNewWebhook((prev) => ({
                                ...prev,
                                events: prev.events.filter((value) => value !== event.value),
                              }));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#00a884] focus:ring-[#00a884]"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Секрет (необязательно)
                  </label>
                  <input
                    type="password"
                    value={newWebhook.secret}
                    onChange={(event) => setNewWebhook((prev) => ({ ...prev, secret: event.target.value }))}
                    placeholder="Секрет webhook для HMAC-проверки"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#00a884] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateWebhook}
                  className="rounded-lg bg-[#00a884] px-4 py-2 text-white hover:bg-[#008f6d]"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
