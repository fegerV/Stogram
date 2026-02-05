import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Resolves a relative media path (e.g. /uploads/xxx.jpg) to a full URL
 * pointing to the API server. Returns null if path is null/undefined.
 * Passes through absolute URLs (http/https/data:/blob:) unchanged.
 */
export const getMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  // Already an absolute URL or data/blob URI
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  return `${API_URL}${path}`;
};

export const formatMessageTime = (date: string | Date): string => {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  }
  
  if (isYesterday(messageDate)) {
    return 'Yesterday';
  }
  
  return format(messageDate, 'MMM d, HH:mm');
};

export const formatLastSeen = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getChatName = (chat: any, currentUserId: string): string => {
  if (chat.type === 'PRIVATE') {
    const otherMember = chat.members.find((m: any) => m.userId !== currentUserId);
    return otherMember?.user?.displayName || otherMember?.user?.username || 'Unknown';
  }
  return chat.name || 'Group Chat';
};

export const getChatAvatar = (chat: any, currentUserId: string): string | null => {
  if (chat.type === 'PRIVATE') {
    const otherMember = chat.members.find((m: any) => m.userId !== currentUserId);
    return getMediaUrl(otherMember?.user?.avatar) || null;
  }
  return getMediaUrl(chat.avatar);
};
