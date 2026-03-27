import React from 'react';

export type SettingsSection =
  | 'main'
  | 'chat-settings'
  | 'privacy'
  | 'notifications'
  | 'language'
  | 'data'
  | 'appearance'
  | 'security'
  | 'sessions'
  | 'bots'
  | 'folders';

export interface SettingsNavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  subtitle?: string;
  color?: string;
}

export interface Session {
  id: string;
  device: string;
  ipAddress: string;
  userAgent: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface StorageInfo {
  messages: { count: number; estimatedBytes: number };
  media: { count: number; totalBytes: number };
  contacts: { count: number; estimatedBytes: number };
  chats: { count: number; estimatedBytes: number };
  cache: { entriesCount: number; estimatedBytes: number };
  total: { estimatedBytes: number; formatted: string };
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order: number;
  chatSettings?: Array<{
    chat?: {
      id: string;
      name?: string;
      type?: string;
    };
  }>;
}
