import React from 'react';
import { ArrowLeft, Camera, Search, X } from 'lucide-react';
import { useSettingsI18n } from './i18n';

interface SettingsMainHeaderProps {
  avatarSrc: string;
  displayName: string;
  settingsSearch: string;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SettingsMainHeader({
  avatarSrc,
  displayName,
  settingsSearch,
  avatarInputRef,
  onClose,
  onSearchChange,
  onAvatarChange,
}: SettingsMainHeaderProps) {
  const { t } = useSettingsI18n();

  return (
    <>
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-white/5 bg-[#17212b] px-2 text-white">
        <button onClick={onClose} className="rounded-full p-2.5 transition hover:bg-white/10">
          <ArrowLeft className="h-[22px] w-[22px]" />
        </button>
        <h2 className="ml-2 flex-1 text-[18px] font-semibold">{t('settings.title')}</h2>
        <button onClick={onClose} className="rounded-full p-2.5 transition hover:bg-white/10">
          <X className="h-[20px] w-[20px]" />
        </button>
      </div>

      <div className="bg-[#17212b] px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-2.5 text-white/80 ring-1 ring-white/5">
          <Search className="h-[15px] w-[15px]" />
          <input
            value={settingsSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('settings.search')}
            className="w-full bg-transparent text-[13px] placeholder:text-white/35 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-[#17212b] px-4 pb-3">
        <button
          onClick={() => avatarInputRef.current?.click()}
          className="w-full rounded-[20px] bg-white/10 px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3390ec] text-lg font-bold text-white">
                  {displayName.charAt(0) || 'U'}
                </div>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#3390ec] text-white shadow-md">
                <Camera className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] font-semibold text-white">{displayName}</h2>
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
