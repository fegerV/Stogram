import { memo } from 'react';
import { Forward } from 'lucide-react';
import LinkPreview from '../LinkPreview';
import MessageStatus from '../MessageStatus';
import SelfDestructTimer from '../SelfDestructTimer';
import { formatMessageTime } from '../../utils/helpers';
import { ChatType, Message } from '../../types';
import { MessageAttachment } from './MessageAttachment';
import ru from '../../i18n/ru';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentChatType: ChatType;
  onMessageContextMenu: (event: React.MouseEvent<HTMLDivElement>, messageId: string) => void;
  onExpireMessage: (messageId: string) => void;
}

function MessageBubbleComponent({
  message,
  isOwn,
  currentChatType,
  onMessageContextMenu,
  onExpireMessage,
}: MessageBubbleProps) {
  const isReadByRecipient = Boolean(
    message.readBy?.some((readerId) => readerId !== message.senderId) ||
      message.reads?.some((read) => read.userId !== message.senderId)
  );
  const deliveryStatus =
    message.deliveryStatus === 'failed' || message.deliveryStatus === 'pending'
      ? message.deliveryStatus
      : message.isRead || isReadByRecipient
        ? 'read'
        : message.isSent
          ? 'delivered'
          : 'sent';

  return (
    <div
      id={`message-${message.id}`}
      className={`mb-1 flex transition ${isOwn ? 'justify-end' : 'justify-start'}`}
      onContextMenu={(event) => onMessageContextMenu(event, message.id)}
    >
      <div
        className={`max-w-[70%] px-3 py-2 xl:max-w-[56%] ${
          isOwn
            ? 'rounded-lg rounded-tr-none bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]'
            : 'rounded-lg rounded-tl-none bg-white text-[#111b21] shadow-sm dark:bg-[#202c33] dark:text-[#e9edef]'
        }`}
        style={{
          borderRadius: isOwn ? '7.5px 7.5px 0 7.5px' : '7.5px 7.5px 7.5px 0',
        }}
      >
        {message.isForwarded && (
          <div className="mb-1 border-b border-[#667781]/20 pb-1 dark:border-[#8696a0]/20">
            <p className="flex items-center gap-1 text-xs text-[#667781] dark:text-[#8696a0]">
              <Forward className="h-3 w-3" />
              {ru.chat.messages.forwarded}
            </p>
          </div>
        )}

        {!isOwn && currentChatType !== ChatType.PRIVATE && (
          <p className="mb-0.5 text-xs font-semibold text-[#3390ec] dark:text-[#53bdeb]">
            {message.bot?.displayName ||
              message.bot?.username ||
              message.sender.displayName ||
              message.sender.username}
          </p>
        )}

        <MessageAttachment message={message} />

        {message.content && <p className="break-words text-[15px] leading-[1.4]">{message.content}</p>}

        {message.linkPreview && typeof message.linkPreview === 'object' && (
          <div className="mt-2">
            <LinkPreview preview={message.linkPreview} messageId={message.id} />
          </div>
        )}

        {message.expiresAt && (
          <div className="mt-1">
            <SelfDestructTimer expiresAt={message.expiresAt} onExpire={() => onExpireMessage(message.id)} />
          </div>
        )}

        <div className={`mt-0.5 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-[#667781] dark:text-[#8696a0]">
            {formatMessageTime(message.createdAt)}
          </span>
          {message.isEdited && <span className="text-xs text-[#667781] dark:text-[#8696a0]">({ru.chat.messages.edited})</span>}
          {isOwn && <MessageStatus status={deliveryStatus} isOwn />}
        </div>
      </div>
    </div>
  );
}

function areEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
  return (
    prev.message === next.message &&
    prev.isOwn === next.isOwn &&
    prev.currentChatType === next.currentChatType &&
    prev.onMessageContextMenu === next.onMessageContextMenu &&
    prev.onExpireMessage === next.onExpireMessage
  );
}

export const MessageBubble = memo(MessageBubbleComponent, areEqual);
