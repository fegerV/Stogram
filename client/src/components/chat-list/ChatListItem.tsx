import { BellOff, Pin, Users } from 'lucide-react';
import { ChatType, Message, NotificationLevel } from '../../types';
import {
  formatMessageTime,
  getChatAvatar,
  getChatName,
  getInitials,
} from '../../utils/helpers';
import { getChatMetaFlags, getChatPreview } from './helpers';
import ru from '../../i18n/ru';

interface ChatListItemChat {
  id: string;
  type: ChatType;
  messages?: Message[];
  pinnedMessageId?: string | null;
}

interface ChatListItemProps {
  chat: ChatListItemChat;
  userId?: string;
  selected: boolean;
  settings?: {
    isMuted?: boolean;
    notificationLevel?: NotificationLevel;
    unreadCount?: number;
  };
  onSelect: (chatId: string) => void;
}

export function ChatListItem({
  chat,
  userId,
  selected,
  settings,
  onSelect,
}: ChatListItemProps) {
  const chatName = getChatName(chat as never, userId || '');
  const chatAvatar = getChatAvatar(chat as never, userId || '');
  const lastMessage = chat.messages?.[0];
  const { isMuted, isPinned } = getChatMetaFlags(chat, settings);
  const unreadCount = settings?.unreadCount ?? 0;
  const { previewText, previewSender } = getChatPreview(chat.type, lastMessage);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(chat.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onSelect(chat.id);
        }
      }}
      className={`mx-2 my-1 flex cursor-pointer items-center gap-3 rounded-[24px] px-4 py-3 transition-all ${
        selected
          ? 'bg-[linear-gradient(135deg,rgba(53,94,126,0.72),rgba(28,50,68,0.94))] shadow-[0_16px_38px_rgba(5,12,22,0.28)] ring-1 ring-[#5f88ad]/40'
          : 'hover:bg-white/[0.05] active:bg-white/[0.08]'
      }`}
    >
      <div className="relative flex-shrink-0">
        {chatAvatar ? (
          <img
            src={chatAvatar}
            alt={chatName}
            className="h-[54px] w-[54px] rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div
            className={`flex h-[54px] w-[54px] items-center justify-center rounded-full text-base font-medium text-white shadow-[0_12px_28px_rgba(10,17,28,0.22)] ${
              chat.type === ChatType.GROUP
                ? 'bg-[linear-gradient(135deg,#58c27d,#30945c)]'
                : 'bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)]'
            }`}
          >
            {chat.type === ChatType.GROUP ? <Users className="h-6 w-6" /> : getInitials(chatName)}
          </div>
        )}
        {chat.type === ChatType.PRIVATE && (
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-white bg-[#4fae4e] dark:border-[#0b141a]" />
        )}
      </div>

      <div className="min-w-0 flex-1 py-1.5">
        <div className="mb-0.5 flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <h3 className="truncate text-[15px] font-semibold text-[#f5fbff]">{chatName}</h3>
          </div>
          <div className="ml-2 flex flex-shrink-0 items-center gap-1">
            {lastMessage && (
              <span className={`text-[12px] ${selected ? 'text-white/80' : 'text-[#7f96ab]'}`}>
                {formatMessageTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
        </div>

        {lastMessage && (
          <div className="flex items-center gap-1">
            <p className={`flex-1 truncate text-[14px] ${selected ? 'text-white/80' : 'text-[#8fa3b8]'}`}>
              {previewSender && (
                <span
                  className={
                    selected
                      ? 'font-medium text-white/90'
                      : 'font-medium text-[#78bcff]'
                  }
                >
                  {previewSender}
                </span>
              )}
              {previewText}
            </p>
            {isMuted && (
              <BellOff className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-white/60' : 'text-[#6f879b]'}`} />
            )}
            {isPinned && (
              <Pin className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-white/60' : 'text-[#6f879b]'}`} />
            )}
            {unreadCount > 0 && (
              <span
                className={`flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                  isMuted
                    ? selected
                      ? 'bg-white/20 text-white/80'
                      : 'bg-[#6f879b] text-[#101922]'
                    : selected
                      ? 'bg-white text-[#21384a]'
                      : 'bg-[#3390ec] text-white'
                }`}
                title={ru.chat.list.unread(unreadCount)}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
