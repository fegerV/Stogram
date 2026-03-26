import {
  Bookmark,
  Code,
  Folder,
  LogOut,
  MessageSquare,
  Moon,
  Phone,
  Settings,
  Sun,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { getInitials, getMediaUrl } from '../utils/helpers';

interface DesktopNavRailProps {
  onOpenSettings: () => void;
  onCreateGroup: () => void;
  onOpenContacts: () => void;
  onOpenFavorites: () => void;
  onOpenCalls: () => void;
  onInviteFriends: () => void;
}

interface RailAction {
  icon: typeof MessageSquare;
  label: string;
  onClick: () => void;
}

function RailButton({ icon: Icon, label, onClick }: RailAction) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[#7e97ad] transition hover:bg-[#162330] hover:text-white"
      title={label}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#162330] transition group-hover:bg-[#213243]">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

export default function DesktopNavRail({
  onOpenSettings,
  onCreateGroup,
  onOpenContacts,
  onOpenFavorites,
  onOpenCalls,
  onInviteFriends,
}: DesktopNavRailProps) {
  const { user, logout } = useAuthStore();
  const { effectiveTheme, setTheme } = useThemeStore();

  const avatarUrl = getMediaUrl(user?.avatar);
  const displayName = user?.displayName || user?.username || 'User';

  const mainActions: RailAction[] = [
    { icon: MessageSquare, label: 'Чаты', onClick: onOpenSettings },
    { icon: Folder, label: 'Папки', onClick: onOpenFavorites },
    { icon: Users, label: 'Группа', onClick: onCreateGroup },
    { icon: Phone, label: 'Звонки', onClick: onOpenCalls },
    { icon: Bookmark, label: 'Избранное', onClick: onOpenContacts },
    { icon: Code, label: 'Друзья', onClick: onInviteFriends },
  ];

  return (
    <aside className="hidden md:flex w-[88px] shrink-0 flex-col items-center justify-between border-r border-[#17232d] bg-[#0d1720] px-3 py-4">
      <div className="flex w-full flex-col items-center gap-3">
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-2 rounded-2xl px-2 py-1 text-white transition hover:bg-[#162330]"
          title="Мой профиль"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-12 w-12 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3390ec] text-sm font-semibold">
              {getInitials(displayName)}
            </div>
          )}
          <span className="max-w-[64px] truncate text-[11px] text-[#a9bed0]">{displayName}</span>
        </button>

        <div className="mt-1 flex w-full flex-col gap-1">
          {mainActions.map((action) => (
            <RailButton key={action.label} {...action} />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-1">
        <RailButton icon={UserPlus} label="Контакты" onClick={onOpenContacts} />
        <RailButton icon={Settings} label="Меню" onClick={onOpenSettings} />

        <button
          onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
          className="group flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[#7e97ad] transition hover:bg-[#162330] hover:text-white"
          title="Сменить тему"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#162330] transition group-hover:bg-[#213243]">
            {effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </div>
          <span className="text-[11px] font-medium leading-none">Тема</span>
        </button>

        <button
          onClick={logout}
          className="group flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[#ff8e8e] transition hover:bg-[#261a22]"
          title="Выйти"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#261a22] transition group-hover:bg-[#35202a]">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-medium leading-none">Выход</span>
        </button>
      </div>
    </aside>
  );
}
