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
        toast.error('Действие кнопки не настроено');
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
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white/90 p-3 dark:border-slate-700 dark:bg-[#1f2c33]">
        {preview.keyboardName && (
          <div className="mb-2 text-xs text-slate-500 dark:text-[#8696a0]">{preview.keyboardName}</div>
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
                      className="inline-flex items-center justify-center rounded-xl bg-[#e7f3ff] px-3 py-2 text-sm font-medium text-[#0b6bcb] transition hover:bg-[#d8ebff] dark:bg-[#183247] dark:text-[#84c7ff] dark:hover:bg-[#21425b]"
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
                    className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-[#233138] dark:text-[#e9edef] dark:hover:bg-[#2c3d45]"
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
      className="mt-2 block overflow-hidden rounded-2xl border border-slate-200 transition hover:bg-slate-50 dark:border-[#2a3942] dark:hover:bg-[#2a3942]"
    >
      {preview.image && (
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-[#2a3942]">
          <img
            src={preview.image}
            alt={preview.title || 'Превью'}
            className="h-full w-full object-cover"
            onError={(event) => {
              (event.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3">
        {preview.siteName && (
          <div className="mb-1 flex items-center gap-1 text-xs text-slate-500 dark:text-[#8696a0]">
            <ExternalLink className="h-3 w-3" />
            {preview.siteName}
          </div>
        )}
        {preview.title && <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-[#e9edef]">{preview.title}</h4>}
        {preview.description && <p className="line-clamp-2 text-xs text-slate-500 dark:text-[#8696a0]">{preview.description}</p>}
        <div className="mt-1 truncate text-xs text-[#00a884]">{preview.url}</div>
      </div>
    </a>
  );
}
