import {
  Bell,
  Bot,
  Database,
  FolderOpen,
  Languages,
  MessageCircle,
  Monitor,
  Palette,
  Shield,
  User,
} from 'lucide-react';
import { SettingsNavItem } from './types';

export function getSettingsNavItems(t: (key: string) => string): SettingsNavItem[] {
  return [
    {
      id: 'main',
      label: t('settings.section.myAccount'),
      icon: User,
      subtitle: t('settings.section.myAccountSubtitle'),
      color: 'text-[#3390ec]',
    },
    {
      id: 'notifications',
      label: t('settings.section.notifications'),
      icon: Bell,
      color: 'text-[#ef5350]',
    },
    {
      id: 'privacy',
      label: t('settings.section.privacy'),
      icon: Shield,
      color: 'text-[#8e8e93]',
    },
    {
      id: 'chat-settings',
      label: t('settings.section.chatSettings'),
      icon: MessageCircle,
      color: 'text-[#3390ec]',
    },
    {
      id: 'folders',
      label: t('settings.section.folders'),
      icon: FolderOpen,
      color: 'text-[#3390ec]',
    },
    {
      id: 'appearance',
      label: t('settings.section.appearance'),
      icon: Palette,
      color: 'text-[#e67e22]',
    },
    {
      id: 'language',
      label: t('settings.section.language'),
      icon: Languages,
      color: 'text-[#4fae4e]',
    },
    {
      id: 'security',
      label: t('settings.section.security'),
      icon: Shield,
      subtitle: t('settings.securitySubtitle'),
      color: 'text-[#8e8e93]',
    },
    {
      id: 'sessions',
      label: t('settings.section.sessions'),
      icon: Monitor,
      color: 'text-[#3390ec]',
    },
    {
      id: 'data',
      label: t('settings.section.data'),
      icon: Database,
      color: 'text-[#4fae4e]',
    },
    {
      id: 'bots',
      label: t('settings.section.bots'),
      icon: Bot,
      color: 'text-[#9c27b0]',
    },
  ];
}
