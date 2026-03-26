import { useEffect, useMemo, useState } from 'react';
import { Bot, Plus, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { botApi, chatApi, webhookApi } from '../services/api';
import { Chat } from '../types';

type BotCommand = { id: string; command: string; description: string };
type WebhookItem = { id: string; url: string; events: string | null; isActive: boolean };
type Delivery = { id: string; event: string; status: number; attempts: number; deliveredAt: string; webhook?: { url: string } };
type Installation = { id: string; chatId: string; chat: { id: string; name: string | null; type: string } };
type ManagedBot = {
  id: string;
  username: string;
  displayName: string;
  description?: string | null;
  isActive: boolean;
  isInline: boolean;
  commands: BotCommand[];
  webhooks: WebhookItem[];
};

const DEFAULT_EVENTS = 'message.created, command.received, callback_query';

export default function BotManager() {
  const [bots, setBots] = useState<ManagedBot[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', displayName: '', description: '', isInline: false });
  const [commandForm, setCommandForm] = useState({ command: '', description: '' });
  const [webhookForm, setWebhookForm] = useState({ url: '', events: DEFAULT_EVENTS, secret: '' });
  const [installChatId, setInstallChatId] = useState('');

  const selectedBot = useMemo(() => bots.find((bot) => bot.id === selectedBotId) || null, [bots, selectedBotId]);

  const loadBase = async () => {
    const [botsResponse, chatsResponse] = await Promise.all([botApi.getAll(), chatApi.getAll()]);
    const loadedBots = botsResponse.data as ManagedBot[];
    setBots(loadedBots);
    setChats(chatsResponse.data as Chat[]);
    setSelectedBotId((current) => current || loadedBots[0]?.id || null);
  };

  const loadSelectedBot = async (botId: string) => {
    const [installationsResponse, deliveriesResponse, webhooksResponse, botResponse] = await Promise.all([
      botApi.getInstallations(botId),
      webhookApi.getBotDeliveries(botId),
      webhookApi.getByBot(botId),
      botApi.getById(botId),
    ]);
    setInstallations(installationsResponse.data.installations || []);
    setDeliveries(deliveriesResponse.data.deliveries || []);
    setBots((current) => current.map((bot) => bot.id === botId ? { ...(botResponse.data as ManagedBot), webhooks: webhooksResponse.data || [] } : bot));
  };

  useEffect(() => {
    (async () => {
      try {
        await loadBase();
      } catch (error) {
        console.error(error);
        toast.error('Не удалось загрузить ботов');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedBotId) return;
    loadSelectedBot(selectedBotId).catch((error) => console.error(error));
  }, [selectedBotId]);

  const reloadAll = async () => {
    await loadBase();
    if (selectedBotId) {
      await loadSelectedBot(selectedBotId);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await botApi.create(createForm);
      setShowCreate(false);
      setCreateForm({ username: '', displayName: '', description: '', isInline: false });
      await loadBase();
      setSelectedBotId(response.data.id);
      toast.success('Бот создан');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось создать бота');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!window.confirm('Удалить бота?')) return;
    setBusy(true);
    try {
      await botApi.remove(botId);
      await loadBase();
      toast.success('Бот удалён');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось удалить бота');
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerateToken = async (botId: string) => {
    if (!window.confirm('Регенерировать токен?')) return;
    setBusy(true);
    try {
      const response = await botApi.regenerateToken(botId);
      await navigator.clipboard.writeText(response.data.token);
      toast.success('Новый токен скопирован');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось регенерировать токен');
    } finally {
      setBusy(false);
    }
  };

  const handleAddCommand = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBotId) return;
    setBusy(true);
    try {
      await botApi.addCommand(selectedBotId, commandForm);
      setCommandForm({ command: '', description: '' });
      await loadSelectedBot(selectedBotId);
      toast.success('Команда добавлена');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось добавить команду');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCommand = async (commandId: string) => {
    setBusy(true);
    try {
      await botApi.deleteCommand(commandId);
      if (selectedBotId) await loadSelectedBot(selectedBotId);
    } catch (error) {
      console.error(error);
      toast.error('Не удалось удалить команду');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateWebhook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBotId) return;
    setBusy(true);
    try {
      await webhookApi.create({
        botId: selectedBotId,
        url: webhookForm.url,
        secret: webhookForm.secret || undefined,
        events: webhookForm.events.split(',').map((value) => value.trim()).filter(Boolean),
      });
      setWebhookForm({ url: '', events: DEFAULT_EVENTS, secret: '' });
      await loadSelectedBot(selectedBotId);
      toast.success('Webhook создан');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось создать webhook');
    } finally {
      setBusy(false);
    }
  };

  const toggleWebhook = async (webhookId: string, isActive: boolean) => {
    setBusy(true);
    try {
      await webhookApi.update(webhookId, { isActive: !isActive });
      if (selectedBotId) await loadSelectedBot(selectedBotId);
    } catch (error) {
      console.error(error);
      toast.error('Не удалось обновить webhook');
    } finally {
      setBusy(false);
    }
  };

  const testWebhook = async (webhookId: string) => {
    setBusy(true);
    try {
      await webhookApi.test(webhookId);
      if (selectedBotId) await loadSelectedBot(selectedBotId);
      toast.success('Тестовая доставка выполнена');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось выполнить тест');
    } finally {
      setBusy(false);
    }
  };

  const retryDelivery = async (deliveryId: string) => {
    setBusy(true);
    try {
      await webhookApi.retryDelivery(deliveryId);
      if (selectedBotId) await loadSelectedBot(selectedBotId);
      toast.success('Доставка повторена');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось повторить доставку');
    } finally {
      setBusy(false);
    }
  };

  const installBot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBotId || !installChatId) return;
    setBusy(true);
    try {
      await botApi.installToChat(selectedBotId, installChatId);
      setInstallChatId('');
      await loadSelectedBot(selectedBotId);
      toast.success('Бот подключён к чату');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось подключить бота');
    } finally {
      setBusy(false);
    }
  };

  const uninstallBot = async (chatId: string) => {
    if (!selectedBotId) return;
    setBusy(true);
    try {
      await botApi.uninstallFromChat(selectedBotId, chatId);
      await loadSelectedBot(selectedBotId);
    } catch (error) {
      console.error(error);
      toast.error('Не удалось отключить бота');
    } finally {
      setBusy(false);
    }
  };

  const availableChats = chats.filter((chat) => !installations.some((item) => item.chatId === chat.id));

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#3390ec]" /></div>;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
      <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Боты</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Telegram-подобный runtime</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="rounded-xl bg-[#3390ec] p-2 text-white"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="space-y-2">
          {bots.map((bot) => (
            <button key={bot.id} type="button" onClick={() => setSelectedBotId(bot.id)} className={`w-full rounded-2xl border px-3 py-3 text-left ${selectedBotId === bot.id ? 'border-[#3390ec]/40 bg-[#3390ec]/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'}`}>
              <div className="font-medium text-slate-900 dark:text-white">{bot.displayName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">@{bot.username}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {selectedBot ? (
          <>
            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#3390ec]/10 text-[#3390ec]"><Bot className="h-6 w-6" /></div>
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{selectedBot.displayName}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{selectedBot.username}</p>
                    {selectedBot.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedBot.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleRegenerateToken(selectedBot.id)} disabled={busy} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"><RefreshCw className="mr-2 inline h-4 w-4" />Токен</button>
                  <button type="button" onClick={() => handleDeleteBot(selectedBot.id)} disabled={busy} className="rounded-2xl border border-red-200 px-4 py-2 text-sm text-red-600 dark:border-red-500/30"><Trash2 className="mr-2 inline h-4 w-4" />Удалить</button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Команды</h3>
                <form onSubmit={handleAddCommand} className="mb-4 grid gap-3">
                  <input value={commandForm.command} onChange={(event) => setCommandForm((current) => ({ ...current, command: event.target.value }))} placeholder="/start" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  <input value={commandForm.description} onChange={(event) => setCommandForm((current) => ({ ...current, description: event.target.value }))} placeholder="Описание команды" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  <button type="submit" disabled={busy || !commandForm.command || !commandForm.description} className="rounded-2xl bg-[#3390ec] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">Добавить команду</button>
                </form>
                <div className="space-y-2">
                  {selectedBot.commands.map((command) => (
                    <div key={command.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{command.command}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{command.description}</div>
                      </div>
                      <button type="button" onClick={() => handleDeleteCommand(command.id)} className="rounded-xl p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Webhook</h3>
                <form onSubmit={handleCreateWebhook} className="mb-4 grid gap-3">
                  <input value={webhookForm.url} onChange={(event) => setWebhookForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://example.com/webhook" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  <input value={webhookForm.events} onChange={(event) => setWebhookForm((current) => ({ ...current, events: event.target.value }))} placeholder={DEFAULT_EVENTS} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  <input value={webhookForm.secret} onChange={(event) => setWebhookForm((current) => ({ ...current, secret: event.target.value }))} placeholder="secret (optional)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  <button type="submit" disabled={busy || !webhookForm.url} className="rounded-2xl bg-[#3390ec] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">Добавить webhook</button>
                </form>
                <div className="space-y-3">
                  {selectedBot.webhooks.map((webhook) => (
                    <div key={webhook.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                      <div className="truncate font-medium text-slate-900 dark:text-white">{webhook.url}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{webhook.events}</div>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => testWebhook(webhook.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">Тест</button>
                        <button type="button" onClick={() => toggleWebhook(webhook.id, webhook.isActive)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">{webhook.isActive ? 'Пауза' : 'Включить'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Установки в чатах</h3>
                <form onSubmit={installBot} className="mb-4 grid gap-3">
                  <select value={installChatId} onChange={(event) => setInstallChatId(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <option value="">Выбрать чат</option>
                    {availableChats.map((chat) => <option key={chat.id} value={chat.id}>{chat.name || chat.type}</option>)}
                  </select>
                  <button type="submit" disabled={busy || !installChatId} className="rounded-2xl bg-[#3390ec] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">Подключить к чату</button>
                </form>
                <div className="space-y-2">
                  {installations.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{item.chat.name || item.chat.type}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{item.chat.type}</div>
                      </div>
                      <button type="button" onClick={() => uninstallBot(item.chatId)} className="rounded-xl border border-red-200 px-3 py-2 text-xs text-red-600 dark:border-red-500/30">Отключить</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Доставки webhook</h3>
                  <button type="button" onClick={reloadAll} className="rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">Обновить</button>
                </div>
                <div className="space-y-2">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                      <div className="font-medium text-slate-900 dark:text-white">{delivery.event}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">status {delivery.status || 0} • attempts {delivery.attempts} • {new Date(delivery.deliveredAt).toLocaleString()}</div>
                      {delivery.status < 200 || delivery.status >= 300 ? (
                        <button type="button" onClick={() => retryDelivery(delivery.id)} className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">Повторить</button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/60">
            <Bot className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Создай первого бота</h3>
            <button type="button" onClick={() => setShowCreate(true)} className="mt-4 rounded-2xl bg-[#3390ec] px-4 py-3 text-sm font-medium text-white">Создать</button>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Создать бота</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={createForm.username} onChange={(event) => setCreateForm((current) => ({ ...current, username: event.target.value }))} placeholder="username" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={createForm.displayName} onChange={(event) => setCreateForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Отображаемое имя" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <textarea value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} placeholder="Описание" rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={createForm.isInline} onChange={(event) => setCreateForm((current) => ({ ...current, isInline: event.target.checked }))} />Inline-бот</label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">Отмена</button>
                <button type="submit" disabled={busy || !createForm.username || !createForm.displayName} className="flex-1 rounded-2xl bg-[#3390ec] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
