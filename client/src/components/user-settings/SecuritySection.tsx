import { Divider, SectionLabel } from './SettingsPrimitives';
import { useSettingsI18n } from './i18n';

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SecuritySectionProps {
  securityStatus: any;
  changePasswordData: ChangePasswordData;
  onDisable2FA: () => void;
  onOpen2FA: () => void;
  onChangePassword: (event: React.FormEvent) => void;
  onPasswordDataChange: (data: ChangePasswordData) => void;
  renderHeader: (title: string) => JSX.Element;
}

export function SecuritySection({
  securityStatus,
  changePasswordData,
  onDisable2FA,
  onOpen2FA,
  onChangePassword,
  onPasswordDataChange,
  renderHeader,
}: SecuritySectionProps) {
  const { t } = useSettingsI18n();

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.security'))}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
        <SectionLabel text={t('settings.security.2fa')} />
        <div className="px-5 py-3.5">
          {securityStatus ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">
                  {t('settings.security.status')}:{' '}
                  {securityStatus.twoFactorEnabled ? (
                    <span className="font-medium text-[#4fae4e]">{t('settings.security.enabled')}</span>
                  ) : (
                    <span className="font-medium text-[#ef5350]">{t('settings.security.disabled')}</span>
                  )}
                </p>
              </div>
              <button
                onClick={securityStatus.twoFactorEnabled ? onDisable2FA : onOpen2FA}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  securityStatus.twoFactorEnabled ? 'bg-[#ef5350]' : 'bg-[#3390ec]'
                }`}
              >
                {securityStatus.twoFactorEnabled ? t('settings.security.disable') : t('settings.security.enable')}
              </button>
            </div>
          ) : (
            <p className="text-[#8e8e93]">{t('settings.loading')}</p>
          )}
        </div>

        <Divider />

        <SectionLabel text={t('settings.security.changePassword')} />
        <form onSubmit={onChangePassword} className="space-y-3 px-5 pb-5">
          <input
            type="password"
            placeholder={t('settings.security.currentPassword')}
            value={changePasswordData.currentPassword}
            onChange={(event) =>
              onPasswordDataChange({ ...changePasswordData, currentPassword: event.target.value })
            }
            className="w-full rounded-lg bg-[#efeff4] px-4 py-3 text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#3390ec] dark:bg-[#202b36] dark:text-white"
            required
          />
          <input
            type="password"
            placeholder={t('settings.security.newPassword')}
            value={changePasswordData.newPassword}
            onChange={(event) =>
              onPasswordDataChange({ ...changePasswordData, newPassword: event.target.value })
            }
            className="w-full rounded-lg bg-[#efeff4] px-4 py-3 text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#3390ec] dark:bg-[#202b36] dark:text-white"
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder={t('settings.security.confirmPassword')}
            value={changePasswordData.confirmPassword}
            onChange={(event) =>
              onPasswordDataChange({ ...changePasswordData, confirmPassword: event.target.value })
            }
            className="w-full rounded-lg bg-[#efeff4] px-4 py-3 text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#3390ec] dark:bg-[#202b36] dark:text-white"
            required
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-[#3390ec] py-3 font-medium text-white transition hover:bg-[#2b7fd4]"
          >
            {t('settings.security.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
