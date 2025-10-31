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

  const handleQuickReaction = (emoji: string) => {
    onReact(emoji);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {QUICK_REACTIONS.map((emoji) => {
          const count = existingReactions[emoji]?.length || 0;
          return (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="relative px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              title={`React with ${emoji}`}
            >
              <span className="text-lg">{emoji}</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          title="More reactions"
        >
          <Smile size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        </>
      )}
    </div>
  );
};
