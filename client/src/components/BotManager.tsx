import React, { useState, useEffect } from 'react';
import { Bot, Plus, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface BotType {
  id: string;
  username: string;
  displayName: string;
  description?: string;
  avatar?: string;
  isActive: boolean;
  isInline: boolean;
  token?: string;
  commands: BotCommand[];
  webhooks: any[];
}

interface BotCommand {
  id: string;
  command: string;
  description: string;
}

const BotManager: React.FC = () => {
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    description: '',
    isInline: false
  });

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBots(response.data);
    } catch (error) {
      console.error('Failed to load bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/bots', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBots([...bots, response.data]);
      setShowCreateForm(false);
      setFormData({ username: '', displayName: '', description: '', isInline: false });
    } catch (error) {
      console.error('Failed to create bot:', error);
      alert('Ошибка при создании бота');
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого бота?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/bots/${botId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBots(bots.filter(b => b.id !== botId));
    } catch (error) {
      console.error('Failed to delete bot:', error);
    }
  };

  const handleRegenerateToken = async (botId: string) => {
    if (!confirm('Регенерировать токен? Старый токен перестанет работать.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/bots/${botId}/regenerate-token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Новый токен: ${response.data.token}\n\nСохраните его в безопасном месте!`);
      loadBots();
    } catch (error) {
      console.error('Failed to regenerate token:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Управление ботами</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Создать бота
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Создать нового бота
            </h2>
            <form onSubmit={handleCreateBot}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="mybot"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Отображаемое имя
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="My Bot"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Описание бота..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isInline"
                    checked={formData.isInline}
                    onChange={(e) => setFormData({ ...formData, isInline: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isInline" className="text-sm text-gray-700 dark:text-gray-300">
                    Inline бот
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>У вас пока нет ботов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bots.map(bot => (
            <div key={bot.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {bot.displayName}
                    </h3>
                    <p className="text-sm text-gray-500">@{bot.username}</p>
                  </div>
                  {bot.isInline && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                      Inline
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded ${
                    bot.isActive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}>
                    {bot.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRegenerateToken(bot.id)}
                    className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                    title="Регенерировать токен"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBot(bot.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Удалить бота"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {bot.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{bot.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Команды:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {bot.commands.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Вебхуки:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {bot.webhooks.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotManager;
