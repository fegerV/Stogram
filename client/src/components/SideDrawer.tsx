import { useEffect, useRef } from 'react';
import {
  Bookmark,
  LogOut,
  Moon,
  Phone,
  Sun,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { getInitials, getMediaUrl } from '../utils/helpers';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onCreateGroup: () => void;
  onOpenContacts: () => void;
  onOpenFavorites: () => void;
  onOpenCalls: () => void;
  onInviteFriends: () => void;
}

export default function SideDrawer({
  isOpen,
  onClose,
  onOpenSettings,
  onCreateGroup,
  onOpenContacts,
  onOpenFavorites,
  onOpenCalls,
  onInviteFriends,
}: SideDrawerProps) {
  const { user, logout } = useAuthStore();
  const { effectiveTheme, setTheme } = useThemeStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleMenuAction = (action: () => void) => {
    onClose();
    action();
  };

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  const avatarUrl = getMediaUrl(user?.avatar);
  const displayName = user?.displayName || user?.username || 'Пользователь';

  const menuItems = [
    { icon: User, label: 'Профиль и настройки', action: onOpenSettings },
    { icon: Users, label: 'Создать группу', action: onCreateGroup },
    { icon: User, label: 'Контакты', action: onOpenContacts },
    { icon: Phone, label: 'Звонки', action: onOpenCalls },
    { icon: Bookmark, label: 'Избранное', action: onOpenFavorites },
  ];

  const secondaryItems = [{ icon: UserPlus, label: 'Пригласить друзей', action: onInviteFriends }];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'animate-fade-in opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col panel-glass-strong transition-transform duration-300 ease-out sm:w-[340px] ${
          isOpen ? 'animate-sheet-left translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Меню навигации"
      >
        <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(36,62,88,0.92),rgba(18,31,45,0.94))] p-5 pb-6">
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={onClose}
              className="panel-soft rounded-full p-2 transition hover:bg-white/10"
              aria-label="Закрыть меню"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={toggleTheme}
              className="panel-soft rounded-full p-2 transition hover:bg-white/10"
              aria-label="Сменить тему"
            >
              {effectiveTheme === 'dark' ? <Sun className="h-5 w-5 text-white" /> : <Moon className="h-5 w-5 text-white" />}
            </button>
          </div>

          <div className="mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-20 w-20 rounded-full border-2 border-white/15 object-cover shadow-[0_18px_40px_rgba(7,17,27,0.28)]"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/15 bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(47,140,255,0.32)]">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <div>
            <p className="text-[18px] font-semibold leading-tight text-white">{displayName}</p>
            <p className="mt-1 text-sm text-white/65">@{user?.username || ''}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleMenuAction(item.action)}
                className="mb-1 flex w-full items-center gap-4 rounded-[22px] px-4 py-3.5 text-[#e1eef8] transition-colors hover:bg-white/[0.05] active:bg-white/[0.08]"
              >
                <div className="panel-soft flex h-10 w-10 items-center justify-center rounded-[16px]">
                  <Icon className="h-5 w-5 text-[#9fc1de]" />
                </div>
                <span className="text-[15px] font-medium">{item.label}</span>
              </button>
            );
          })}

          <div className="my-3 h-px bg-white/8" />

          {secondaryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={`secondary-${index}`}
                onClick={() => handleMenuAction(item.action)}
                className="flex w-full items-center gap-4 rounded-[22px] px-4 py-3.5 text-[#e1eef8] transition-colors hover:bg-white/[0.05]"
              >
                <div className="panel-soft flex h-10 w-10 items-center justify-center rounded-[16px]">
                  <Icon className="h-5 w-5 text-[#9fc1de]" />
                </div>
                <span className="text-[15px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/8 px-3 py-3">
          <button
            onClick={() => handleMenuAction(logout)}
            className="flex w-full items-center gap-4 rounded-[22px] px-4 py-3.5 text-[#ff9c9c] transition-colors hover:bg-red-500/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-red-500/12">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="text-[15px] font-medium">Выйти</span>
          </button>
        </div>
      </div>
    </>
  );
}
