import { useEffect, useRef } from 'react';
import {
  Bookmark,
  LogOut,
  Moon,
  Phone,
  Settings,
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

  const secondaryItems = [
    { icon: UserPlus, label: 'Пригласить друзей', action: onInviteFriends },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-[#17212b] sm:w-[320px] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Меню навигации"
      >
        <div className="relative bg-[#517da2] p-4 pb-5 dark:bg-[#242f3d]">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="rounded-full p-1 transition hover:bg-white/10"
              aria-label="Закрыть меню"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 transition hover:bg-white/10"
              aria-label="Сменить тему"
            >
              {effectiveTheme === 'dark' ? (
                <Sun className="h-5 w-5 text-white" />
              ) : (
                <Moon className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          <div className="mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-16 w-16 rounded-full border-2 border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-[#3390ec] text-xl font-semibold text-white">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <div>
            <p className="text-[16px] font-semibold leading-tight text-white">{displayName}</p>
            <p className="mt-0.5 text-sm text-white/70">@{user?.username || ''}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleMenuAction(item.action)}
                className="flex w-full items-center gap-5 px-6 py-3.5 text-[#222222] transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-[#e1e1e1] dark:hover:bg-[#202b36] dark:active:bg-[#2b3a47]"
              >
                <Icon className="h-[22px] w-[22px] text-[#8e8e93] dark:text-[#6c7883]" />
                <span className="text-[15px] font-normal">{item.label}</span>
              </button>
            );
          })}

          <div className="my-2 h-px bg-gray-200 dark:bg-[#202c33]" />

          {secondaryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={`secondary-${index}`}
                onClick={() => handleMenuAction(item.action)}
                className="flex w-full items-center gap-5 px-6 py-3.5 text-[#222222] transition-colors hover:bg-gray-100 dark:text-[#e1e1e1] dark:hover:bg-[#202b36]"
              >
                <Icon className="h-[22px] w-[22px] text-[#8e8e93] dark:text-[#6c7883]" />
                <span className="text-[15px] font-normal">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-200 py-2 dark:border-[#202c33]">
          <button
            onClick={() => handleMenuAction(logout)}
            className="flex w-full items-center gap-5 px-6 py-3.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"
          >
            <LogOut className="h-[22px] w-[22px]" />
            <span className="text-[15px] font-normal">Выйти</span>
          </button>
        </div>
      </div>
    </>
  );
}
