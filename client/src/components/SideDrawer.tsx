import { useEffect, useRef } from 'react';
import {
  User,
  Users,
  Phone,
  Bookmark,
  Settings,
  UserPlus,
  Moon,
  Sun,
  LogOut,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { getMediaUrl, getInitials } from '../utils/helpers';

interface SideDrawerProps {
  /** Whether the drawer is currently visible */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** Navigate to the user settings/profile page */
  onOpenSettings: () => void;
  /** Navigate to create a new group */
  onCreateGroup: () => void;
  /** Navigate to contacts list */
  onOpenContacts: () => void;
}

/**
 * Telegram-style side navigation drawer.
 * Slides in from the left with user profile and menu items.
 */
export default function SideDrawer({
  isOpen,
  onClose,
  onOpenSettings,
  onCreateGroup,
  onOpenContacts,
}: SideDrawerProps) {
  const { user, logout } = useAuthStore();
  const { effectiveTheme, setTheme } = useThemeStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  /** Close drawer on Escape key */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  const handleMenuAction = (action: () => void) => {
    onClose();
    action();
  };

  const avatarUrl = getMediaUrl(user?.avatar);
  const displayName = user?.displayName || user?.username || 'Пользователь';

  const menuItems = [
    { icon: User, label: 'Мой профиль', action: onOpenSettings },
    { icon: Users, label: 'Создать группу', action: onCreateGroup },
    { icon: User, label: 'Контакты', action: onOpenContacts },
    { icon: Phone, label: 'Звонки', action: () => {} },
    { icon: Bookmark, label: 'Избранное', action: () => {} },
    { icon: Settings, label: 'Настройки', action: onOpenSettings },
  ];

  const secondaryItems = [
    { icon: UserPlus, label: 'Пригласить друзей', action: () => {} },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] bg-white dark:bg-[#17212b] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Меню навигации"
      >
        {/* Profile Header */}
        <div className="relative bg-[#517da2] dark:bg-[#242f3d] p-4 pb-5">
          {/* Close + Theme toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition"
              aria-label="Закрыть меню"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-white/10 rounded-full transition"
              aria-label="Сменить тему"
            >
              {effectiveTheme === 'dark' ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Avatar */}
          <div className="mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#3390ec] flex items-center justify-center text-white font-semibold text-xl border-2 border-white/20">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          {/* Name & Username */}
          <div>
            <p className="text-white font-semibold text-[16px] leading-tight">
              {displayName}
            </p>
            <p className="text-white/70 text-sm mt-0.5">
              @{user?.username || ''}
            </p>
          </div>
        </div>

        {/* Main Menu */}
        <div className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleMenuAction(item.action)}
                className="w-full flex items-center gap-5 px-6 py-3.5 text-[#222222] dark:text-[#e1e1e1] hover:bg-gray-100 dark:hover:bg-[#202b36] transition-colors active:bg-gray-200 dark:active:bg-[#2b3a47]"
              >
                <Icon className="w-[22px] h-[22px] text-[#8e8e93] dark:text-[#6c7883]" />
                <span className="text-[15px] font-normal">{item.label}</span>
              </button>
            );
          })}

          {/* Separator */}
          <div className="h-px bg-gray-200 dark:bg-[#202c33] my-2" />

          {secondaryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={`secondary-${index}`}
                onClick={() => handleMenuAction(item.action)}
                className="w-full flex items-center gap-5 px-6 py-3.5 text-[#222222] dark:text-[#e1e1e1] hover:bg-gray-100 dark:hover:bg-[#202b36] transition-colors"
              >
                <Icon className="w-[22px] h-[22px] text-[#8e8e93] dark:text-[#6c7883]" />
                <span className="text-[15px] font-normal">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 dark:border-[#202c33] py-2">
          <button
            onClick={() => handleMenuAction(logout)}
            className="w-full flex items-center gap-5 px-6 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-[22px] h-[22px]" />
            <span className="text-[15px] font-normal">Выйти</span>
          </button>
        </div>
      </div>
    </>
  );
}
