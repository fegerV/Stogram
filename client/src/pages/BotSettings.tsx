import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { telegramBotApi } from '../services/api';

const DEFAULT_COMMANDS = [
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show help information' },
  { command: 'status', description: 'Check account status' },
  { command: 'chats', description: 'List your chats' },
  { command: 'unread', description: 'Show unread messages' },
  { command: 'search', description: 'Search messages' },
  { command: 'notify', description: 'Manage notifications' },
  { command: 'connect', description: 'Connect Stogram account' },
  { command: 'disconnect', description: 'Disconnect account' },
];

interface BotSettingsProps {
  embedded?: boolean;
}

export default function BotSettings({ embedded = false }: BotSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [config, setConfig] = useState({
    botToken: '',
    botUsername: '',
    webhookUrl: '',
    commands: DEFAULT_COMMANDS,
    notifications: true,
    enabled: false,
  });
  
  const [stats, setStats] = useState({
    authorizedUsers: 0,
    totalMessages: 0,
    enabled: false,
    botUsername: '',
  });
  
  const [users, setUsers] = useState<any[]>([]);
  const [botInfo, setBotInfo] = useState<any>(null);

  useEffect(() => {
    loadConfig();
    loadStats();
    loadUsers();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await telegramBotApi.getConfig();
      const data = response.data;
      setConfig({
        botToken: data.botToken || '',
        botUsername: data.botUsername || '',
        webhookUrl: data.webhookUrl || '',
        commands: data.commands || DEFAULT_COMMANDS,
        notifications: data.notifications ?? true,
        enabled: data.enabled ?? false,
      });
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await telegramBotApi.getStats();
      const data = response.data;
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await telegramBotApi.getUsers();
      const data = response.data;
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await telegramBotApi.saveConfig(config);
      toast.success('Settings saved successfully');
      loadStats();
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.botToken) {
      toast.error('Please enter a bot token');
      return;
    }
    
    setTesting(true);
    try {
      const response = await telegramBotApi.testConnection(config.botToken);
      const data = response.data;
      if (data.success) {
        setBotInfo(data.bot);
        setConfig({
          ...config,
          botUsername: data.bot.username,
          botToken: config.botToken, // Keep the full token for saving
        });
        toast.success(`Connected to @${data.bot.username}!`);
      } else {
        toast.error(data.error || 'Failed to connect to bot');
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      toast.error('Failed to connect to bot');
    } finally {
      setTesting(false);
    }
  };

  const handleBroadcast = async () => {
    const message = prompt('Enter broadcast message:');
    if (!message) return;
    
    try {
      const response = await telegramBotApi.broadcast(message);
      const data = response.data;
      if (data.success) {
        toast.success(`Message sent to ${data.usersNotified} users`);
      } else {
        toast.error('Failed to broadcast message');
      }
    } catch (error) {
      console.error('Failed to broadcast:', error);
      toast.error('Failed to broadcast message');
    }
  };

  const handleCommandChange = (index: number, field: string, value: string) => {
    const newCommands = [...config.commands];
    newCommands[index] = { ...newCommands[index], [field]: value };
    setConfig({ ...config, commands: newCommands });
  };

  const handleAddCommand = () => {
    setConfig({
      ...config,
      commands: [...config.commands, { command: '', description: '' }],
    });
  };

  const handleRemoveCommand = (index: number) => {
    const newCommands = config.commands.filter((_, i) => i !== index);
    setConfig({ ...config, commands: newCommands });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[240px]' : 'min-h-screen'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-100 dark:bg-gray-900 p-6'}>
      <div className={embedded ? '' : 'max-w-4xl mx-auto'}>
        <h1 className={`font-bold text-gray-900 dark:text-white mb-6 ${embedded ? 'text-xl' : 'text-2xl'}`}>
          Telegram Bot Settings
        </h1>

        {/* Bot Info Card */}
        {botInfo && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 mb-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <h2 className="text-xl font-bold">@{botInfo.username}</h2>
                <p className="text-blue-100">{botInfo.firstName}</p>
                <p className="text-sm text-blue-200">ID: {botInfo.id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Authorized Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.authorizedUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMessages}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className={`text-2xl font-bold ${stats.enabled ? 'text-green-600' : 'text-gray-400'}`}>
              {stats.enabled ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bot Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={config.botToken}
                  onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                  placeholder="Enter your Telegram bot token"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testing || !config.botToken}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  {testing ? 'Testing...' : 'Test'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook URL (optional)
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://your-server.com/api/telegram-bot/webhook"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for long polling mode
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notifications}
                  onChange={(e) => setConfig({ ...config, notifications: e.target.checked })}
                  className="h-4 w-4 text-[#00a884] focus:ring-[#00a884] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable notifications
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="h-4 w-4 text-[#00a884] focus:ring-[#00a884] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable bot
                </span>
              </label>
            </div>
            
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6d] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Commands */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bot Commands
            </h2>
            <button
              onClick={handleAddCommand}
              className="px-3 py-1 text-sm bg-[#00a884] text-white rounded hover:bg-[#008f6d]"
            >
              Add Command
            </button>
          </div>
          
          <div className="space-y-3">
            {config.commands.map((cmd, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={cmd.command}
                  onChange={(e) => handleCommandChange(index, 'command', e.target.value)}
                  placeholder="command"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={cmd.description}
                  onChange={(e) => handleCommandChange(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => handleRemoveCommand(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Authorized Users
            </h2>
            <button
              onClick={handleBroadcast}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Broadcast
            </button>
          </div>
          
          {users.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No authorized users yet
            </p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
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
                    Connected: {new Date(user.updatedAt).toLocaleDateString()}
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
