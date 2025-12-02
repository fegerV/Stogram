import React, { useState, useEffect } from 'react';
import { Shield, Eye, Clock, Image } from 'lucide-react';
import { userApi } from '../utils/monitoredApi';
import toast from 'react-hot-toast';

interface PrivacySettingsProps {
  onClose: () => void;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    showProfilePhoto: true,
    showLastSeen: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await userApi.get('/privacy');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
      toast.error('Не удалось загрузить настройки приватности');
    }
  };

  const updateSettings = async (updates: Partial<typeof settings>) => {
    setLoading(true);
    try {
      const response = await userApi.patch('/privacy', updates);
      setSettings(response.data.settings || response.data);
      toast.success('Настройки обновлены');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast.error('Не удалось обновить настройки');
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold dark:text-white">Приватность</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-medium dark:text-white">Показывать статус онлайн</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Другие пользователи смогут видеть, когда вы онлайн
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.showOnlineStatus}
                    onChange={() => updateSettings({ showOnlineStatus: !settings.showOnlineStatus })}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Image className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-medium dark:text-white">Показывать фото профиля</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Ваше фото профиля будет видно всем пользователям
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.showProfilePhoto}
                    onChange={() => updateSettings({ showProfilePhoto: !settings.showProfilePhoto })}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-medium dark:text-white">Показывать время последнего посещения</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Другие смогут видеть, когда вы были в сети последний раз
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.showLastSeen}
                    onChange={() => updateSettings({ showLastSeen: !settings.showLastSeen })}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Совет:</strong> Если вы отключите показ статуса онлайн, вы также не сможете видеть статус других пользователей.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
