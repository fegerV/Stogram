import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

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
    return otherMember?.user?.avatar || null;
  }
  return chat.avatar;
};
