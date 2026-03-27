import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';

interface EmojiInputProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EmojiPicker = lazy(() => import('emoji-picker-react'));

export const EmojiInput = ({ onEmojiSelect, className = '' }: EmojiInputProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setShowPicker((current) => !current)}
        className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-[#2a3942]"
        title="Добавить эмодзи"
      >
        <Smile className="h-5 w-5 text-gray-600 dark:text-[#8696a0]" />
      </button>

      {showPicker && (
        <div className="absolute bottom-full right-0 z-50 mb-2 overflow-hidden rounded-[24px] border border-slate-200/80 shadow-2xl dark:border-slate-700">
          <Suspense
            fallback={
              <div className="flex h-[350px] w-[320px] items-center justify-center bg-white/95 text-sm text-slate-500 dark:bg-slate-900/95 dark:text-slate-400">
                Загружаем эмодзи...
              </div>
            }
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              skinTonesDisabled
              searchDisabled={false}
              previewConfig={{ showPreview: false }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};
