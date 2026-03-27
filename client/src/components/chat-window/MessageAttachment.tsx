import { Paperclip } from 'lucide-react';
import { getMediaUrl } from '../../utils/helpers';
import { Message, MessageType } from '../../types';
import { getRenderableMessageType } from './helpers';

interface MessageAttachmentProps {
  message: Message;
}

export function MessageAttachment({ message }: MessageAttachmentProps) {
  const fileUrl = getMediaUrl(message.fileUrl);

  if (!fileUrl) {
    return null;
  }

  const originalFileUrl = fileUrl.replace('_compressed', '');
  const messageType = getRenderableMessageType(message, fileUrl);

  return (
    <div className="mb-2">
      {messageType === MessageType.IMAGE && (
        <div className="group relative">
          <img
            src={fileUrl}
            alt={message.content || 'Image'}
            className="max-h-96 max-w-full cursor-pointer rounded-lg bg-gray-200 object-contain dark:bg-gray-700"
            style={{ minHeight: '80px', minWidth: '120px' }}
            loading="lazy"
            onClick={() => window.open(fileUrl, '_blank')}
            onLoad={(event) => {
              const target = event.target as HTMLImageElement;
              target.style.minHeight = '';
              target.style.minWidth = '';
            }}
            onError={(event) => {
              const target = event.target as HTMLImageElement;
              const currentSrc = target.src;

              if (currentSrc.includes('_compressed') && originalFileUrl !== currentSrc) {
                if (!target.dataset.fallbackTried) {
                  target.dataset.fallbackTried = 'true';
                  target.src = originalFileUrl;
                  return;
                }
              }

              target.style.display = 'none';
              const fallback = target.nextElementSibling;
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
          <a
            href={fileUrl}
            download={message.fileName || 'image'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-gray-100 p-3 transition hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            style={{ display: 'none' }}
          >
            <Paperclip className="h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{message.fileName || 'Image'}</p>
              <p className="text-xs text-gray-500">Click to download</p>
            </div>
          </a>
        </div>
      )}

      {messageType === MessageType.VIDEO && (
        <div className="mb-1">
          <video
            src={fileUrl}
            controls
            className="max-h-96 max-w-full rounded-lg"
            poster={message.thumbnailUrl ? getMediaUrl(message.thumbnailUrl) ?? undefined : undefined}
          />
        </div>
      )}

      {messageType === MessageType.AUDIO && (
        <div className="mb-1">
          <audio src={fileUrl} controls className="w-full" />
        </div>
      )}

      {(messageType === MessageType.FILE || !messageType) && (
        <a
          href={fileUrl}
          download={message.fileName || undefined}
          className="flex items-center gap-2 rounded bg-gray-100 p-2 transition hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Paperclip className="h-4 w-4" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{message.fileName || 'File'}</p>
            {message.fileSize && (
              <p className="text-xs text-gray-500">{(message.fileSize / 1024).toFixed(2)} KB</p>
            )}
          </div>
        </a>
      )}
    </div>
  );
}
