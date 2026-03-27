import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { socketService } from '../../services/socket';
import { Chat, MessageType } from '../../types';

const PENDING_CALL_REQUEST_KEY = 'stogram-pending-call-request';

interface UseChatComposerParams {
  chatId: string;
  currentChat: Chat | null;
  sendMessage: (
    chatId: string,
    content: string,
    file?: File,
    type?: MessageType | 'VOICE',
    expiresIn?: number,
  ) => Promise<unknown>;
  onStartCall: (type: 'AUDIO' | 'VIDEO') => void;
}

export function useChatComposer({
  chatId,
  currentChat,
  sendMessage,
  onStartCall,
}: UseChatComposerParams) {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selfDestructSeconds, setSelfDestructSeconds] = useState<number | null>(null);
  const [showSelfDestructOptions, setShowSelfDestructOptions] = useState(false);
  const selfDestructButtonRef = useRef<HTMLButtonElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentChat || currentChat.id !== chatId || currentChat.type !== 'PRIVATE') {
      return;
    }

    try {
      const rawRequest = sessionStorage.getItem(PENDING_CALL_REQUEST_KEY);
      if (!rawRequest) {
        return;
      }

      const request = JSON.parse(rawRequest) as {
        chatId?: string;
        type?: 'AUDIO' | 'VIDEO';
        createdAt?: number;
      };
      const isFresh = typeof request.createdAt === 'number' && Date.now() - request.createdAt < 15000;

      if (request.chatId === chatId && request.type && isFresh) {
        sessionStorage.removeItem(PENDING_CALL_REQUEST_KEY);
        window.setTimeout(() => onStartCall(request.type!), 0);
      } else if (!isFresh) {
        sessionStorage.removeItem(PENDING_CALL_REQUEST_KEY);
      }
    } catch (error) {
      console.error('Failed to consume pending quick call request:', error);
      sessionStorage.removeItem(PENDING_CALL_REQUEST_KEY);
    }
  }, [chatId, currentChat, onStartCall]);

  const handleTyping = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(event.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socketService.typing(chatId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.typing(chatId, false);
    }, 1000);
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!messageInput.trim()) {
      return;
    }

    const content = messageInput;
    const expiresIn = selfDestructSeconds;
    setMessageInput('');
    setSelfDestructSeconds(null);
    socketService.typing(chatId, false);

    await sendMessage(chatId, content, undefined, undefined, expiresIn || undefined);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
    if (!input) {
      return;
    }

    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    let messageType: MessageType = MessageType.FILE;
    if (file.type.startsWith('image/')) {
      messageType = MessageType.IMAGE;
    } else if (file.type.startsWith('video/')) {
      messageType = MessageType.VIDEO;
    } else if (file.type.startsWith('audio/')) {
      messageType = MessageType.AUDIO;
    }

    const isMedia = [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO].includes(messageType);
    const content = messageInput || (isMedia ? '' : file.name);
    void sendMessage(chatId, content, file, messageType);
    setMessageInput('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleVoiceSend = async (audioBlob: Blob) => {
    try {
      const audioFile = new File([audioBlob], 'voice.webm', { type: audioBlob.type || 'audio/webm' });
      await sendMessage(chatId, '', audioFile, 'VOICE');
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error('Не удалось отправить голосовое сообщение');
    }
  };

  return {
    messageInput,
    showVoiceRecorder,
    selfDestructSeconds,
    showSelfDestructOptions,
    selfDestructButtonRef,
    fileInputRef,
    setShowVoiceRecorder,
    setSelfDestructSeconds,
    setShowSelfDestructOptions,
    setMessageInput,
    handleTyping,
    handleSendMessage,
    handleEmojiSelect,
    handleFileSelect,
    handleFileButtonClick,
    handleVoiceSend,
  };
}
