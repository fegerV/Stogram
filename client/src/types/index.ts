export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  status: UserStatus;
  lastSeen: string;
  emailVerified?: boolean;
  theme?: string;
  createdAt: string;
}

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
}

export interface Chat {
  id: string;
  name: string | null;
  type: ChatType;
  avatar: string | null;
  description: string | null;
  pinnedMessageId?: string | null;
  pinnedMessage?: Message | null;
  createdAt: string;
  updatedAt: string;
  members: ChatMember[];
  messages?: Message[];
}

export enum ChatType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
}

export interface ChatMember {
  id: string;
  userId: string;
  chatId: string;
  role: MemberRole;
  joinedAt: string;
  user: User;
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum NotificationLevel {
  ALL = 'ALL',
  MENTIONS = 'MENTIONS',
  MUTED = 'MUTED',
}

export interface Message {
  id: string;
  clientMessageId?: string | null;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  content: string | null;
  type: MessageType;
  senderId: string;
  botId?: string | null;
  chatId: string;
  replyToId: string | null;
  forwardedFromId?: string | null;
  forwardedFromChatId?: string | null;
  forwardedFromUserId?: string | null;
  isForwarded?: boolean;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  waveform?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  isSent?: boolean;
  isRead?: boolean;
  readBy?: string[]; // Array of user IDs who read the message
  reads?: Array<{ userId: string; readAt: string }>;
  linkPreview?: LinkPreview | null;
  createdAt: string;
  updatedAt: string;
  sender: User;
  bot?: {
    id: string;
    username: string;
    displayName: string | null;
    avatar?: string | null;
  } | null;
  replyTo?: Message;
  reactions?: Reaction[];
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  VOICE = 'VOICE',
  SYSTEM = 'SYSTEM',
  GIF = 'GIF',
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

export interface Call {
  id: string;
  chatId: string;
  initiatorId: string;
  type: CallType;
  status: CallStatus;
  startedAt: string;
  endedAt: string | null;
  initiator: User;
}

export enum CallType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export enum CallStatus {
  CALLING = 'CALLING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  MISSED = 'MISSED',
  DECLINED = 'DECLINED',
}

export interface LinkPreview {
  kind?: 'link' | 'bot_keyboard' | 'bot_meta';
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  botId?: string;
  keyboardId?: string;
  keyboardName?: string;
  buttons?: BotKeyboardButton[][];
}

export interface BotKeyboardButton {
  text: string;
  url?: string;
  callbackData?: string;
  data?: string;
}

export interface Contact {
  id: string;
  userId: string;
  contactId: string;
  nickname: string | null;
  createdAt: string;
  contact: User;
}

export interface AuthResponse {
  user: User;
  token: string;
}
