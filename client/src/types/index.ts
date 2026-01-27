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

export interface Message {
  id: string;
  content: string | null;
  type: MessageType;
  senderId: string;
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
  linkPreview?: LinkPreview | null;
  createdAt: string;
  updatedAt: string;
  sender: User;
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
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
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
