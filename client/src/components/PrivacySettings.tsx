import React, { useEffect, useState } from 'react';
import { Clock, Eye, Image, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../utils/monitoredApi';

interface PrivacySettingsProps {
  onClose: () => void;
}

type PrivacyState = {
  showOnlineStatus: boolean;
  showProfilePhoto: boolean;
  showLastSeen: boolean;
};

const ToggleSwitch = ({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: () => void;
  disabled: boolean;
}) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-[#3390ec]' : 'bg-slate-300 dark:bg-slate-600'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const PrivacyCard = ({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  disabled,
}: {
  icon: typeof Eye;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled: boolean;
}) => (
  <div className="rounded-3xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/80">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-2xl bg-white p-2 text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <ToggleSwitch enabled={enabled} onChange={onToggle} disabled={disabled} />
        </div>
      </div>
    </div>
  </div>
);

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<PrivacyState>({
    showOnlineStatus: true,
    showProfilePhoto: true,
    showLastSeen: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchSettings();
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

  const updateSettings = async (updates: Partial<PrivacyState>) => {
    setLoading(true);
    try {
      const response = await userApi.patch('/privacy', updates);
      setSettings(response.data.settings || response.data);
      toast.success('Настройки приватности обновлены');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast.error('Не удалось обновить настройки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#3390ec]/10 p-2 text-[#3390ec]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Приватность</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Управляйте тем, какие данные видят другие пользователи.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <PrivacyCard
            icon={Eye}
            title="Показывать статус онлайн"
            description="Если отключить эту опцию, другие пользователи не будут видеть, когда вы в сети."
            enabled={settings.showOnlineStatus}
            onToggle={() => void updateSettings({ showOnlineStatus: !settings.showOnlineStatus })}
            disabled={loading}
          />

          <PrivacyCard
            icon={Image}
            title="Показывать фото профиля"
            description="Разрешите другим видеть вашу фотографию и аватар в профиле."
            enabled={settings.showProfilePhoto}
            onToggle={() => void updateSettings({ showProfilePhoto: !settings.showProfilePhoto })}
            disabled={loading}
          />

          <PrivacyCard
            icon={Clock}
            title="Показывать время последнего посещения"
            description="Позволяет другим видеть, когда вы были в приложении в последний раз."
            enabled={settings.showLastSeen}
            onToggle={() => void updateSettings({ showLastSeen: !settings.showLastSeen })}
            disabled={loading}
          />

          <div className="rounded-3xl border border-blue-200/80 bg-blue-50/90 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <p className="text-sm leading-6 text-blue-900 dark:text-blue-200">
              Если вы скрываете статус онлайн, приложение также может ограничить отображение статуса других
              пользователей для вас.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
