import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';

interface EmojiInputProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

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
        onClick={() => setShowPicker(!showPicker)}
        className="p-2 hover:bg-gray-100 rounded-full transition"
        title="Добавить эмодзи"
      >
        <Smile className="w-5 h-5 text-gray-600" />
      </button>

      {showPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <EmojiPicker 
            onEmojiClick={handleEmojiClick}
            skinTonesDisabled
            searchDisabled={false}
            previewConfig={{
              showPreview: false
            }}
          />
        </div>
      )}
    </div>
  );
};
