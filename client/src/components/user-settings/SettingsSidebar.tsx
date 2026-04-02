import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { useSettingsI18n } from './i18n';
import { SettingsNavItem, SettingsSection } from './types';

interface SettingsSidebarProps {
  avatarSrc: string;
  displayName: string;
  username?: string;
  section: SettingsSection;
  settingsSearch: string;
  filteredSettingsNavItems: SettingsNavItem[];
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsSidebar({
  avatarSrc,
  displayName,
  username,
  section,
  settingsSearch,
  filteredSettingsNavItems,
  onClose,
  onSearchChange,
  onSectionChange,
}: SettingsSidebarProps) {
  const { t } = useSettingsI18n();

  return (
    <aside className="hidden lg:flex lg:w-[318px] lg:flex-col lg:border-r lg:border-[#202c33] lg:bg-[#17212b]">
      <div className="flex items-center gap-2 px-4 py-3 text-white">
        <button
          onClick={onClose}
          className="rounded-full p-2 transition hover:bg-white/10"
          aria-label={t('settings.closeFull')}
        >
          <ArrowLeft className="h-[22px] w-[22px]" />
        </button>
        <h2 className="flex-1 text-[20px] font-semibold">{t('settings.title')}</h2>
      </div>

      <div className="px-4 pb-3">
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

      <div className="px-3 pb-3">
        <button
          onClick={() => onSectionChange('main')}
          className={`w-full rounded-[20px] px-4 py-3 text-left transition ${
            section === 'main'
              ? 'bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
              : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3390ec] text-lg font-bold text-white">
                {displayName.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-white">{displayName}</p>
              <p className="truncate text-[13px] text-white/50">@{username || 'user'}</p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 pb-4">
        {filteredSettingsNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = section === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-left transition ${
                isActive
                  ? 'bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
                  : 'hover:bg-white/5'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-white' : item.color || 'text-white/55'}`} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[14px] ${isActive ? 'text-white' : 'text-white/82'}`}>{item.label}</p>
                {item.subtitle && <p className="truncate text-[11px] text-white/35">{item.subtitle}</p>}
              </div>
              <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white/70' : 'text-white/25'}`} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
