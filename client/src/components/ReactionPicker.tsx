import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  existingReactions?: Record<string, any[]>;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉'];

export const ReactionPicker = ({ onReact, existingReactions = {} }: ReactionPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onReact(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
        {QUICK_REACTIONS.map((emoji) => {
          const count = existingReactions[emoji]?.length || 0;

          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              className="relative rounded-xl px-2 py-1 text-lg transition hover:bg-slate-100 dark:hover:bg-slate-800"
              title={`Реакция ${emoji}`}
            >
              <span>{emoji}</span>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3390ec] text-[10px] text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowPicker((current) => !current)}
          className="rounded-xl px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Больше реакций"
        >
          <Smile size={20} className="text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-2 overflow-hidden rounded-[24px] border border-slate-200/80 shadow-2xl dark:border-slate-700">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        </>
      )}
    </div>
  );
};
