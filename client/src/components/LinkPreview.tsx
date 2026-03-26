import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { botEnhancedApi } from '../services/api';
import { BotKeyboardButton, LinkPreview as LinkPreviewType } from '../types';

interface LinkPreviewProps {
  preview: LinkPreviewType;
  messageId?: string;
}

const normalizeButtonData = (button: BotKeyboardButton) => button.callbackData || button.data || '';

export default function LinkPreview({ preview, messageId }: LinkPreviewProps) {
  const [pendingCallback, setPendingCallback] = useState<string | null>(null);

  if (preview.kind === 'bot_meta') {
    return null;
  }

  if (preview.kind === 'bot_keyboard') {
    const buttonRows = Array.isArray(preview.buttons) ? preview.buttons : [];

    const handleCallbackClick = async (button: BotKeyboardButton) => {
      const callbackData = normalizeButtonData(button);
      if (!preview.botId || !messageId || !callbackData) {
        toast.error('Button action is not configured');
        return;
      }

      setPendingCallback(callbackData);
      try {
        await botEnhancedApi.createCallbackQuery({
          botId: preview.botId,
          messageId,
          callbackData,
        });
        toast.success('Команда отправлена боту');
      } catch (error: any) {
        console.error('Failed to send callback query:', error);
        toast.error(error?.response?.data?.error || 'Не удалось выполнить действие');
      } finally {
        setPendingCallback(null);
      }
    };

    return (
      <div className="mt-2 rounded-lg border border-gray-200 dark:border-[#2a3942] p-3 bg-white/80 dark:bg-[#1f2c33]">
        {preview.keyboardName && (
          <div className="text-xs text-[#667781] dark:text-[#8696a0] mb-2">
            {preview.keyboardName}
          </div>
        )}
        <div className="space-y-2">
          {buttonRows.map((row, rowIndex) => (
            <div key={`${preview.keyboardId || 'keyboard'}-${rowIndex}`} className="flex flex-wrap gap-2">
              {row.map((button, buttonIndex) => {
                const callbackData = normalizeButtonData(button);
                const isPending = pendingCallback === callbackData && Boolean(callbackData);

                if (button.url) {
                  return (
                    <a
                      key={`${button.text}-${buttonIndex}`}
                      href={button.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-[#e7f3ff] text-[#0b6bcb] hover:bg-[#d8ebff] dark:bg-[#183247] dark:text-[#84c7ff] dark:hover:bg-[#21425b] transition"
                    >
                      {button.text}
                    </a>
                  );
                }

                return (
                  <button
                    key={`${button.text}-${buttonIndex}`}
                    type="button"
                    onClick={() => handleCallbackClick(button)}
                    disabled={isPending || !callbackData}
                    className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-[#f0f2f5] text-[#111b21] hover:bg-[#e4e7ea] dark:bg-[#233138] dark:text-[#e9edef] dark:hover:bg-[#2c3d45] transition disabled:opacity-60"
                  >
                    {isPending ? '...' : button.text}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-lg border border-gray-200 dark:border-[#2a3942] overflow-hidden hover:bg-gray-50 dark:hover:bg-[#2a3942] transition"
    >
      {preview.image && (
        <div className="w-full h-48 bg-gray-100 dark:bg-[#2a3942] relative overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title || 'Preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3">
        {preview.siteName && (
          <div className="text-xs text-[#667781] dark:text-[#8696a0] mb-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {preview.siteName}
          </div>
        )}
        {preview.title && (
          <h4 className="font-semibold text-[#111b21] dark:text-[#e9edef] text-sm mb-1 line-clamp-2">
            {preview.title}
          </h4>
        )}
        {preview.description && (
          <p className="text-xs text-[#667781] dark:text-[#8696a0] line-clamp-2">
            {preview.description}
          </p>
        )}
        <div className="text-xs text-[#00a884] dark:text-[#00a884] mt-1 truncate">
          {preview.url}
        </div>
      </div>
    </a>
  );
}
