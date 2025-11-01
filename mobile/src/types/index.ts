export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DO_NOT_DISTURB';
  lastSeen?: Date;
  showOnlineStatus: boolean;
  showProfilePhoto: boolean;
  showLastSeen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP' | 'CHANNEL';
  avatar?: string;
  description?: string;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
  members?: ChatMember[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ChatMember {
  id: string;
  userId: string;
  chatId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: Date;
  user?: User;
}

export interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'VOICE' | 'STICKER';
  senderId: string;
  chatId: string;
  replyToId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  stickerId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  isSilent: boolean;
  mentions: string[];
  hashtags: string[];
  createdAt: Date;
  updatedAt: Date;
  sender?: User;
  replyTo?: Message;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
  user?: User;
}

export interface Call {
  id: string;
  chatId: string;
  initiatorId: string;
  type: 'AUDIO' | 'VIDEO';
  status: 'INITIATED' | 'RINGING' | 'ONGOING' | 'ENDED' | 'MISSED' | 'REJECTED';
  isRecording: boolean;
  recordingUrl?: string;
  startedAt: Date;
  endedAt?: Date;
  participants: CallParticipant[];
}

export interface CallParticipant {
  id: string;
  callId: string;
  userId: string;
  joinedAt: Date;
  leftAt?: Date;
  user?: User;
}

export interface StickerPack {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  isPublic: boolean;
  creatorId: string;
  stickers: Sticker[];
}

export interface Sticker {
  id: string;
  packId: string;
  emoji?: string;
  imageUrl: string;
  width: number;
  height: number;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  icon?: string;
  order: number;
}

export interface ChatSettings {
  id: string;
  userId: string;
  chatId: string;
  isMuted: boolean;
  isFavorite: boolean;
  folderId?: string;
  unreadCount: number;
  lastReadMessageId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Chat: { chatId: string };
  Profile: { userId?: string };
  Settings: undefined;
  NewChat: undefined;
  CallScreen: { callId: string; type: 'AUDIO' | 'VIDEO' };
};
