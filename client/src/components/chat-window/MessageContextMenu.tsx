import { Copy, Edit, Forward, Pin, Trash2 } from 'lucide-react';
import { Message } from '../../types';

interface MessageContextMenuProps {
  contextMenu: { messageId: string; x: number; y: number };
  message: Message | undefined;
  isAdmin: boolean;
  currentUserId?: string;
  onClose: () => void;
  onCopyMessage: (message: Message) => void;
  onForwardMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onEditMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
}

export function MessageContextMenu({
  contextMenu,
  message,
  isAdmin,
  currentUserId,
  onClose,
  onCopyMessage,
  onForwardMessage,
  onPinMessage,
  onEditMessage,
  onDeleteMessage,
}: MessageContextMenuProps) {
  if (!message) {
    return null;
  }

  const isOwn = !message.botId && message.senderId === currentUserId;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 min-w-[190px] max-w-[calc(100vw-16px)] rounded-2xl bg-white py-1 shadow-xl dark:bg-[#202c33]"
        style={{
          left: Math.min(contextMenu.x, window.innerWidth - 220),
          top: Math.min(contextMenu.y, window.innerHeight - 240),
        }}
      >
        <button
          onClick={() => onCopyMessage(message)}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#111b21] hover:bg-gray-100 dark:text-[#e9edef] dark:hover:bg-[#2a3942]"
        >
          <Copy className="h-4 w-4" />
          Копировать
        </button>
        <button
          onClick={() => onForwardMessage(message.id)}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#111b21] hover:bg-gray-100 dark:text-[#e9edef] dark:hover:bg-[#2a3942]"
        >
          <Forward className="h-4 w-4" />
          Переслать
        </button>
        {isAdmin && (
          <button
            onClick={() => onPinMessage(message.id)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#111b21] hover:bg-gray-100 dark:text-[#e9edef] dark:hover:bg-[#2a3942]"
          >
            <Pin className="h-4 w-4" />
            Закрепить
          </button>
        )}
        {isOwn && (
          <>
            <button
              onClick={() => onEditMessage(message)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#111b21] hover:bg-gray-100 dark:text-[#e9edef] dark:hover:bg-[#2a3942]"
            >
              <Edit className="h-4 w-4" />
              Редактировать
            </button>
            <button
              onClick={() => onDeleteMessage(message.id)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-[#2a3942]"
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </button>
          </>
        )}
      </div>
    </>
  );
}
