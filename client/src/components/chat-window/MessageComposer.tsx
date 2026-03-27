import { Clock, Mic, Paperclip, Send } from 'lucide-react';
import type { ChangeEvent, FormEvent, Ref } from 'react';
import { EmojiInput } from '../EmojiInput';
import SelfDestructOptions from '../SelfDestructOptions';

interface MessageComposerProps {
  messageInput: string;
  selfDestructSeconds: number | null;
  showSelfDestructOptions: boolean;
  selfDestructButtonRef: Ref<HTMLButtonElement>;
  fileInputRef: Ref<HTMLInputElement>;
  onSubmit: (event: FormEvent) => void;
  onTyping: (event: ChangeEvent<HTMLInputElement>) => void;
  onEmojiSelect: (emoji: string) => void;
  onVoiceRecorderOpen: () => void;
  onFileButtonClick: () => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleSelfDestructOptions: () => void;
  onSelfDestructSelect: (seconds: number | null) => void;
  onCloseSelfDestructOptions: () => void;
}

export function MessageComposer({
  messageInput,
  selfDestructSeconds,
  showSelfDestructOptions,
  selfDestructButtonRef,
  fileInputRef,
  onSubmit,
  onTyping,
  onEmojiSelect,
  onVoiceRecorderOpen,
  onFileButtonClick,
  onFileSelect,
  onToggleSelfDestructOptions,
  onSelfDestructSelect,
  onCloseSelfDestructOptions,
}: MessageComposerProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-gray-200 bg-[#f0f2f5] px-2 py-2 dark:border-[#202c33] dark:bg-[#202c33] md:px-4 md:py-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
      <div className="flex items-center gap-1 md:gap-2">
        <button
          type="button"
          onClick={onVoiceRecorderOpen}
          className="flex-shrink-0 rounded-full p-1.5 transition hover:bg-gray-200 dark:hover:bg-[#2a3942] md:p-2"
          title="Голосовое сообщение"
        >
          <Mic className="h-5 w-5 text-[#54656f] dark:text-[#8696a0]" />
        </button>
        <button
          type="button"
          onClick={onFileButtonClick}
          className="flex-shrink-0 rounded-full p-1.5 transition hover:bg-gray-200 dark:hover:bg-[#2a3942] md:p-2"
          title="Прикрепить файл"
        >
          <Paperclip className="h-5 w-5 text-[#54656f] dark:text-[#8696a0]" />
        </button>
        <div className="relative hidden md:block">
          <button
            ref={selfDestructButtonRef}
            type="button"
            onClick={onToggleSelfDestructOptions}
            className={`rounded-full p-2 transition hover:bg-gray-200 dark:hover:bg-[#2a3942] ${
              selfDestructSeconds ? 'bg-[#00a884]/20 text-[#00a884]' : ''
            }`}
            title="Самоуничтожающееся сообщение"
          >
            <Clock className="h-5 w-5" />
          </button>
          {showSelfDestructOptions && (
            <SelfDestructOptions onSelect={onSelfDestructSelect} onClose={onCloseSelfDestructOptions} />
          )}
        </div>

        <input
          type="text"
          value={messageInput}
          onChange={onTyping}
          placeholder="Сообщение"
          className="min-w-0 flex-1 rounded-full border-none bg-white px-3 py-2 text-[15px] text-[#111b21] placeholder-[#667781] focus:outline-none dark:bg-[#2a3942] dark:text-[#e9edef] dark:placeholder-[#8696a0] md:px-4 md:py-2.5"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit(event);
            }
          }}
        />

        <EmojiInput onEmojiSelect={onEmojiSelect} />

        <button
          type="submit"
          className="flex-shrink-0 rounded-full bg-[#00a884] p-1.5 text-white transition hover:bg-[#008069] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#00a884] dark:hover:bg-[#008069] md:p-2"
          disabled={!messageInput.trim()}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
