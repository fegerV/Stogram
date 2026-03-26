import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { n8nApi } from '../services/api';

const AVAILABLE_EVENTS = [
  { value: 'new_message', label: 'New Message' },
  { value: 'new_chat', label: 'New Chat Created' },
  { value: 'user_registered', label: 'User Registered' },
  { value: 'call_started', label: 'Call Started' },
  { value: 'call_ended', label: 'Call Ended' },
  { value: 'message_updated', label: 'Message Updated' },
  { value: 'message_deleted', label: 'Message Deleted' },
  { value: 'chat_updated', label: 'Chat Updated' },
  { value: 'user_status_changed', label: 'User Status Changed' },
  { value: 'reaction_added', label: 'Reaction Added' },
  { value: 'member_joined', label: 'Member Joined' },
  { value: 'member_left', label: 'Member Left' },
];

interface N8nSettingsProps {
  embedded?: boolean;
}

export default function N8nSettings({ embedded = false }: N8nSettingsProps) {
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
    loadConfig();
    loadWebhooks();
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
      const data = response.data;
      setWebhooks(data.webhooks || []);
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
      toast.success('Settings saved successfully');
      await loadConfig();
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl) {
      toast.error('Please enter a webhook URL');
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
        toast.success('Test webhook sent successfully!');
      } else {
        toast.error(data.error || 'Failed to send test webhook');
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast.error('Failed to send test webhook');
    } finally {
      setTesting(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.webhookUrl || newWebhook.events.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      await n8nApi.createWebhook(newWebhook);
      toast.success('Webhook created successfully');
      setShowCreateModal(false);
      setNewWebhook({ name: '', webhookUrl: '', events: [], secret: '' });
      loadWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast.error('Failed to create webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      await n8nApi.deleteWebhook(id);
      toast.success('Webhook deleted');
      loadWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  const handleToggleWebhook = async (id: string, enabled: boolean) => {
    try {
      await n8nApi.updateWebhook(id, { enabled });
      toast.success(enabled ? 'Webhook enabled' : 'Webhook disabled');
      loadWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
      toast.error('Failed to update webhook');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[240px]' : 'min-h-screen'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className={embedded ? '' : 'min-h-screen bg-gray-100 dark:bg-gray-900 p-6'}>
        <div className={`${embedded ? '' : 'max-w-4xl mx-auto'} bg-white dark:bg-gray-800 rounded-lg shadow p-6`}>
          <h1 className={`font-bold text-gray-900 dark:text-white mb-2 ${embedded ? 'text-xl' : 'text-2xl'}`}>
            n8n Integration Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This section is available only to administrators. Add your user to `ADMIN_USER_IDS` on the server to manage the n8n integration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-100 dark:bg-gray-900 p-6'}>
      <div className={embedded ? '' : 'max-w-4xl mx-auto'}>
        <h1 className={`font-bold text-gray-900 dark:text-white mb-6 ${embedded ? 'text-xl' : 'text-2xl'}`}>
          n8n Integration Settings
        </h1>

        {/* Main Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Connection Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://your-n8n-instance.com/webhook/..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setApiKeyDirty(true);
                }}
                placeholder={hasSavedApiKey ? 'Saved API key is configured. Enter a new key only to replace it' : 'Enter your n8n API key'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                {hasSavedApiKey
                  ? 'An API key is already saved. Leave this field empty to keep it, or paste a new key to replace it.'
                  : 'Optional Bearer token for authenticated n8n webhook calls.'}
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="h-4 w-4 text-[#00a884] focus:ring-[#00a884] border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable n8n integration
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6d] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={handleTestWebhook}
                disabled={testing || !config.webhookUrl}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>
        </div>

        {/* Webhooks List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Webhooks
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6d]"
            >
              Add Webhook
            </button>
          </div>
          
          {webhooks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No webhooks configured yet
            </p>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {webhook.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {webhook.webhookUrl}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {JSON.parse(webhook.events || '[]').map((event: string) => (
                          <span
                            key={event}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleWebhook(webhook.id, !webhook.enabled)}
                        className={`px-3 py-1 text-sm rounded ${
                          webhook.enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {webhook.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Webhook Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create Webhook
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    placeholder="My Webhook"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={newWebhook.webhookUrl}
                    onChange={(e) => setNewWebhook({ ...newWebhook, webhookUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Events
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label key={event.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhook({
                                ...newWebhook,
                                events: [...newWebhook.events, event.value],
                              });
                            } else {
                              setNewWebhook({
                                ...newWebhook,
                                events: newWebhook.events.filter((e) => e !== event.value),
                              });
                            }
                          }}
                          className="h-4 w-4 text-[#00a884] focus:ring-[#00a884] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {event.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Secret (optional)
                  </label>
                  <input
                    type="password"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    placeholder="Webhook secret for HMAC validation"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6d]"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
