import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Phone, Video, Search, Mic, Forward, Copy, Edit, Trash2, Clock, ArrowLeft, Pin, PinOff, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';
import { getChatAvatar, getChatName, formatMessageTime, getInitials, getMediaUrl } from '../utils/helpers';
import CallModal from './CallModal';
import IncomingCallModal from './IncomingCallModal';
import { EmojiInput } from './EmojiInput';
import MessageStatus from './MessageStatus';
import ForwardMessageModal from './ForwardMessageModal';
import MessageSearch from './MessageSearch';
import VoiceRecorder from './VoiceRecorder';
import SelfDestructTimer from './SelfDestructTimer';
import SelfDestructOptions from './SelfDestructOptions';
import LinkPreview from './LinkPreview';
import { TypingIndicator } from './TypingIndicator';
import { Call, ChatType, Message, MessageType, NotificationLevel } from '../types';
import { messageApi, chatApi, chatSettingsApi } from '../services/api';
import ChatSettingsDrawer from './ChatSettingsDrawer';
import PinnedMessageBanner from './PinnedMessageBanner';
import ChatProfileDrawer from './ChatProfileDrawer';
import { monitoredApi } from '../utils/monitoredApi';

const PENDING_CALL_REQUEST_KEY = 'stogram-pending-call-request';

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
}

export default function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  interface FolderOption {
    id: string;
    name: string;
    color?: string;
  }

  const { currentChat, messages, selectChat, sendMessage, markMessageAsRead, deleteMessage: deleteMessageFromStore } = useChatStore();
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string; displayName?: string }>>(new Map());
  const [showCallModal, setShowCallModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callType, setCallType] = useState<'AUDIO' | 'VIDEO'>('AUDIO');
  const [isInitiator, setIsInitiator] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [selfDestructSeconds, setSelfDestructSeconds] = useState<number | null>(null);
  const [showSelfDestructOptions, setShowSelfDestructOptions] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showChatProfile, setShowChatProfile] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [chatSettings, setChatSettings] = useState<{ isMuted?: boolean; notificationLevel?: NotificationLevel; folderId?: string | null } | null>(null);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const selfDestructButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectChat(chatId);
  }, [chatId]);

  useEffect(() => {
    if (currentChat && user) {
      const member = currentChat.members?.find((m: any) => m.userId === user.id);
      setIsAdmin(member?.role === 'OWNER' || member?.role === 'ADMIN');
    }
  }, [currentChat, user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setShowChatProfile(true);
    }
  }, [chatId]);

  useEffect(() => {
    const loadChatSettings = async () => {
      try {
        const response = await chatSettingsApi.get(chatId);
        setChatSettings(response.data.settings);
      } catch (error) {
        console.error('Failed to load chat settings:', error);
      }
    };
    loadChatSettings();
  }, [chatId]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const response = await monitoredApi.get('/folders');
        setFolders(response.data.folders || []);
      } catch (error) {
        console.error('Failed to load folders for chat settings:', error);
      }
    };

    loadFolders();
  }, []);

  useEffect(() => {
    // Обработка новых сообщений
    const handleNewMessage = (message: Message) => {
      // Добавляем сообщение только если оно для текущего чата
      if (message.chatId === chatId) {
        const { addMessage: addMessageToStore } = useChatStore.getState();
        addMessageToStore(message);
      }
    };

    // Обработка событий прочтения сообщений
    const handleMessageRead = ({ messageId, userId }: { messageId: string; userId: string }) => {
      markMessageAsRead(messageId, userId);
    };

    // Обработка истекших сообщений
    const handleMessageExpired = ({ messageIds }: { messageIds: string[] }) => {
      messageIds.forEach((messageId) => {
        deleteMessageFromStore(messageId);
      });
    };

    socketService.on('message:new', handleNewMessage);
    socketService.on('message:read', handleMessageRead);
    socketService.on('message:expired', handleMessageExpired);

    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('message:read', handleMessageRead);
      socketService.off('message:expired', handleMessageExpired);
    };
  }, [chatId, markMessageAsRead, deleteMessageFromStore]);

  useEffect(() => {
    // Обработка входящих звонков
    const handleIncomingCall = (call: Call) => {
      // Если мы инициатор - открываем модальное окно звонка
      if (call.chatId === chatId && call.initiatorId === user?.id && !activeCallId) {
        setActiveCallId(call.id);
        setCallType(call.type as 'AUDIO' | 'VIDEO');
        setIsInitiator(true);
        setShowCallModal(true);
      }
      // Если мы получатель - показываем модальное окно входящего звонка
      else if (call.chatId === chatId && call.initiatorId !== user?.id && !activeCallId) {
        setIncomingCall(call);
      }
    };

    // Обработка инициированного звонка (для инициатора)
    const handleCallInitiated = ({ callId, call }: { callId: string; call: Call }) => {
      if (call.chatId === chatId && !activeCallId) {
        setActiveCallId(callId);
        setCallType(call.type as 'AUDIO' | 'VIDEO');
        setIsInitiator(true);
        setShowCallModal(true);
      }
    };

    // Обработка принятого звонка
    const handleCallAnswered = ({ callId, userId }: { callId: string; userId: string }) => {
      // Если это входящий звонок, который мы приняли
      if (incomingCall?.id === callId) {
        setIncomingCall(null);
        setActiveCallId(callId);
        setShowCallModal(true);
        setIsInitiator(false); // Мы не инициатор, мы приняли звонок
      } 
      // Если это наш исходящий звонок, который приняли
      else if (userId !== user?.id && !activeCallId) {
        setActiveCallId(callId);
        setShowCallModal(true);
        setIsInitiator(true); // Мы инициатор
      }
    };

    // Обработка отклоненного звонка
    const handleCallRejected = ({ callId }: { callId: string }) => {
      if (incomingCall?.id === callId) {
        setIncomingCall(null);
      }
      if (activeCallId === callId) {
        setShowCallModal(false);
        setActiveCallId(null);
      }
    };

    // Обработка завершенного звонка
    const handleCallEnded = ({ callId }: { callId: string }) => {
      if (activeCallId === callId) {
        setShowCallModal(false);
        setActiveCallId(null);
      }
      setIncomingCall(null);
    };

    const handleCallMissed = ({ callId }: { callId: string }) => {
      if (activeCallId === callId || incomingCall?.id === callId) {
        setShowCallModal(false);
        setActiveCallId(null);
        setIncomingCall(null);
        toast('Call was missed');
      }
    };

    socketService.on('call:incoming', handleIncomingCall);
    socketService.on('call:initiated', handleCallInitiated);
    socketService.on('call:answered', handleCallAnswered);
    socketService.on('call:rejected', handleCallRejected);
    socketService.on('call:ended', handleCallEnded);
    socketService.on('call:missed', handleCallMissed);

    return () => {
      socketService.off('call:incoming', handleIncomingCall);
      socketService.off('call:initiated', handleCallInitiated);
      socketService.off('call:answered', handleCallAnswered);
      socketService.off('call:rejected', handleCallRejected);
      socketService.off('call:ended', handleCallEnded);
      socketService.off('call:missed', handleCallMissed);
    };
  }, [chatId, user?.id, incomingCall, activeCallId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Обработка события печати от других пользователей
    const handleUserTyping = ({ userId, chatId: eventChatId, isTyping: userIsTyping }: { userId: string; chatId: string; isTyping: boolean }) => {
      // Игнорируем события для других чатов и для себя
      if (eventChatId !== chatId || userId === user?.id) {
        return;
      }

      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        
        if (userIsTyping) {
          // Найти пользователя в чате
          const chatMember = currentChat?.members?.find((m: any) => m.userId === userId);
          if (chatMember?.user) {
            newMap.set(userId, {
              username: chatMember.user.username,
              displayName: chatMember.user.displayName || undefined,
            });
          }
        } else {
          // Удаляем пользователя из списка печатающих
          newMap.delete(userId);
        }
        
        return newMap;
      });
    };

    const handlePinUpdated = ({ chat: updatedChat }: { chat: any }) => {
      if (updatedChat.id === chatId) {
        useChatStore.setState((state) => ({
          currentChat: state.currentChat ? { ...state.currentChat, pinnedMessageId: updatedChat.pinnedMessageId, pinnedMessage: updatedChat.pinnedMessage } : null,
        }));
      }
    };

    socketService.on('user:typing', handleUserTyping);
    socketService.on('chat:pin-updated', handlePinUpdated);

    return () => {
      socketService.off('user:typing', handleUserTyping);
      socketService.off('chat:pin-updated', handlePinUpdated);
      // Очищаем список печатающих при размонтировании
      setTypingUsers(new Map());
    };
  }, [chatId, user?.id, currentChat]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    const content = messageInput;
    const expiresIn = selfDestructSeconds;
    setMessageInput('');
    setSelfDestructSeconds(null);
    socketService.typing(chatId, false);
    
    await sendMessage(chatId, content, undefined, undefined, expiresIn || undefined);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    // Фокусируемся обратно на input после вставки эмодзи
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      input.focus();
      // Устанавливаем курсор в конец
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Определяем тип сообщения на основе типа файла
    let messageType: MessageType = MessageType.FILE;
    if (file.type.startsWith('image/')) {
      messageType = MessageType.IMAGE;
    } else if (file.type.startsWith('video/')) {
      messageType = MessageType.VIDEO;
    } else if (file.type.startsWith('audio/')) {
      messageType = MessageType.AUDIO;
    }

    // For media messages (image/video/audio), don't send filename as content text
    const isMedia = [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO].includes(messageType);
    const content = messageInput || (isMedia ? '' : file.name);
    sendMessage(chatId, content, file, messageType);
    
    // Очищаем поле ввода после отправки файла
    setMessageInput('');
    
    // Сбрасываем input для возможности повторной загрузки того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartCall = (type: 'AUDIO' | 'VIDEO') => {
    if (currentChat?.type !== ChatType.PRIVATE) {
      toast.error('Calls are currently available only in private chats');
      return;
    }

    setCallType(type);
    setIsInitiator(true);
    socketService.initiateCall(chatId, type);
    // Модальное окно откроется после получения call:answered с callId
  };

  useEffect(() => {
    if (!currentChat || currentChat.id !== chatId || currentChat.type !== ChatType.PRIVATE) {
      return;
    }

    try {
      const rawRequest = sessionStorage.getItem(PENDING_CALL_REQUEST_KEY);
      if (!rawRequest) return;

      const request = JSON.parse(rawRequest) as { chatId?: string; type?: 'AUDIO' | 'VIDEO'; createdAt?: number };
      const isFresh = typeof request.createdAt === 'number' && Date.now() - request.createdAt < 15000;

      if (request.chatId === chatId && request.type && isFresh) {
        sessionStorage.removeItem(PENDING_CALL_REQUEST_KEY);
        window.setTimeout(() => handleStartCall(request.type!), 0);
      } else if (!isFresh) {
        sessionStorage.removeItem(PENDING_CALL_REQUEST_KEY);
      }
    } catch (error) {
      console.error('Failed to consume pending quick call request:', error);
      sessionStorage.removeItem(PENDING_CALL_REQUEST_KEY);
    }
  }, [chatId, currentChat]);

  const handleAnswerCall = () => {
    if (incomingCall) {
      setActiveCallId(incomingCall.id);
      setCallType(incomingCall.type as 'AUDIO' | 'VIDEO');
      setIsInitiator(false);
      setShowCallModal(true);
    }
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
  };

  const handleMessageContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({ messageId, x: e.clientX, y: e.clientY });
  };

  const handleForwardMessage = (messageId: string) => {
    setForwardMessageId(messageId);
    setShowForwardModal(true);
    setContextMenu(null);
  };

  const handleCopyMessage = async (message: Message) => {
    if (message.content) {
      await navigator.clipboard.writeText(message.content);
    }
    setContextMenu(null);
  };

  const handleEditMessage = (message: Message) => {
    setMessageInput(message.content || '');
    // TODO: Реализовать редактирование
    setContextMenu(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Удалить сообщение?')) return;
    try {
      await messageApi.delete(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
    setContextMenu(null);
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      await chatApi.pinMessage(chatId, messageId);
      toast.success('Сообщение закреплено');
    } catch (error) {
      console.error('Failed to pin message:', error);
      toast.error('Не удалось закрепить сообщение');
    }
    setContextMenu(null);
  };

  const handleUnpinMessage = async () => {
    try {
      await chatApi.unpinMessage(chatId);
      toast.success('Сообщение откреплено');
    } catch (error) {
      console.error('Failed to unpin message:', error);
      toast.error('Не удалось открепить сообщение');
    }
  };

  const handleUpdateNotificationLevel = async (level: NotificationLevel) => {
    try {
      await chatSettingsApi.updateNotificationLevel(chatId, level);
      setChatSettings((prev) => ({ ...prev, notificationLevel: level, isMuted: level === 'MUTED' }));
      toast.success('Настройки уведомлений обновлены');
    } catch (error) {
      console.error('Failed to update notification level:', error);
      toast.error('Не удалось обновить настройки уведомлений');
    }
  };

  const handleUpdateFolder = async (folderId: string | null) => {
    try {
      await chatSettingsApi.update(chatId, { folderId: folderId ?? undefined });
      setChatSettings((prev) => ({ ...prev, folderId }));
      window.dispatchEvent(
        new CustomEvent('chat-settings-updated', {
          detail: {
            chatId,
            settings: { ...(chatSettings || {}), folderId },
          },
        }),
      );
      toast.success(folderId ? 'Чат добавлен в папку' : 'Чат убран из папки');
    } catch (error) {
      console.error('Failed to update chat folder:', error);
      toast.error('Не удалось обновить папку чата');
    }
  };

  const handleVoiceSend = async (audioBlob: Blob) => {
    try {
      // Convert Blob to File for sendMessage
      const audioFile = new File([audioBlob], 'voice.webm', { type: audioBlob.type || 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('type', 'VOICE');
      formData.append('content', '');
      
      await sendMessage(chatId, '', audioFile, 'VOICE');
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  const handleSearchSelect = (message: Message) => {
    // Прокрутить к сообщению
    const messageElement = document.getElementById(`message-${message.id}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight');
      setTimeout(() => {
        messageElement.classList.remove('highlight');
      }, 2000);
    }
  };

  if (!currentChat) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884] dark:border-[#00a884]"></div>
      </div>
    );
  }

  const chatName = getChatName(currentChat, user?.id || '');
  const chatAvatar = getChatAvatar(currentChat, user?.id || '') || null;
  const canStartCall = currentChat?.type === ChatType.PRIVATE;
  const chatSubtitle =
    currentChat.type === ChatType.PRIVATE
      ? 'личный чат'
      : currentChat.type === ChatType.GROUP
        ? `${currentChat.members.length} участников`
        : 'канал';

  return (
    <div className="flex h-full bg-[#0e1621]">
      <div className="flex min-w-0 flex-1 flex-col bg-[#0f1822]">
      <div className="border-b border-[#21303d] bg-[#18232e] px-3 py-3 text-white shadow-sm dark:border-[#202c33] dark:bg-[#202c33] md:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-white/10 rounded-full transition md:hidden flex-shrink-0"
                title="Назад"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={() => setShowChatProfile(true)}
              className="flex min-w-0 items-center gap-2 md:gap-3 rounded-2xl px-1 py-1 text-left transition hover:bg-white/10"
              title="Открыть профиль"
            >
              {chatAvatar ? (
                <img src={chatAvatar} alt={chatName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3390ec] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                  {getInitials(chatName)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-medium text-white text-[16px]">{chatName}</h2>
                <p className="truncate text-xs text-white/60">{chatSubtitle}</p>
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-1 rounded-2xl bg-white/5 px-1 py-1">
            {currentChat?.pinnedMessageId && (
              <button
                onClick={handleUnpinMessage}
                className="p-2 hover:bg-white/10 rounded-full transition"
                title="Открепить сообщение"
              >
                <PinOff className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="Поиск"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => handleStartCall('AUDIO')}
              disabled={!canStartCall}
              className="p-2 hover:bg-white/10 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Аудиозвонок"
            >
              <Phone className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => handleStartCall('VIDEO')}
              disabled={!canStartCall}
              className="p-2 hover:bg-white/10 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Видеозвонок"
            >
              <Video className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={() => setShowChatSettings(true)}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="Настройки чата"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {currentChat?.pinnedMessage && (
        <PinnedMessageBanner 
          message={currentChat.pinnedMessage} 
          onUnpin={isAdmin ? handleUnpinMessage : undefined}
        />
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#0f1822] scrollbar-thin md:px-7" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(108,130,147,0.16) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
        {messages.map((message) => {
          const isOwn = !message.botId && message.senderId === user?.id;
          const fileUrl = getMediaUrl(message.fileUrl);
          // Create fallback URL for original image if compressed version fails
          // Remove _compressed from path to get original image
          const originalFileUrl = fileUrl?.replace('_compressed', '') || null;
          
          // Автоматически определяем тип медиа для старых сообщений
          let messageType: MessageType = message.type;
          if (fileUrl && (!messageType || messageType === MessageType.FILE)) {
            const fileName = message.fileName || message.fileUrl || '';
            const extension = fileName.split('.').pop()?.toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
              messageType = MessageType.IMAGE;
            } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension || '')) {
              messageType = MessageType.VIDEO;
            } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) {
              messageType = MessageType.AUDIO;
            }
          }
          
          // Debug logging removed to reduce console noise
          
          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 transition`}
              onContextMenu={(e) => handleMessageContextMenu(e, message.id)}
            >
              <div
                className={`max-w-[70%] xl:max-w-[56%] px-3 py-2 ${
                  isOwn
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-lg rounded-tr-none'
                    : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-lg rounded-tl-none shadow-sm'
                }`}
                style={{
                  borderRadius: isOwn 
                    ? '7.5px 7.5px 0 7.5px' 
                    : '7.5px 7.5px 7.5px 0'
                }}
              >
                {/* Информация о пересылке */}
                {message.isForwarded && (
                  <div className="mb-1 pb-1 border-b border-[#667781]/20 dark:border-[#8696a0]/20">
                    <p className="text-xs text-[#667781] dark:text-[#8696a0] flex items-center gap-1">
                      <Forward className="w-3 h-3" />
                      Переслано
                    </p>
                  </div>
                )}
                {!isOwn && currentChat.type !== 'PRIVATE' && (
                  <p className="text-xs font-semibold mb-0.5 text-[#3390ec] dark:text-[#53bdeb]">
                    {message.bot?.displayName || message.bot?.username || message.sender.displayName || message.sender.username}
                  </p>
                )}
                
                {/* Отображение файлов */}
                {fileUrl && (
                  <div className="mb-2">
                    {messageType === MessageType.IMAGE && (
                      <div className="relative group">
                        <img
                          src={fileUrl}
                          alt={message.content || 'Image'}
                          className="max-w-full max-h-96 rounded-lg cursor-pointer object-contain bg-gray-200 dark:bg-gray-700"
                          style={{ minHeight: '80px', minWidth: '120px' }}
                          loading="lazy"
                          onClick={() => window.open(fileUrl, '_blank')}
                          onLoad={(e) => {
                            // Reset min dimensions after load
                            const target = e.target as HTMLImageElement;
                            target.style.minHeight = '';
                            target.style.minWidth = '';
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const currentSrc = target.src;
                            
                            // Try fallback to original image if compressed version failed
                            if (currentSrc.includes('_compressed') && originalFileUrl && originalFileUrl !== currentSrc) {
                              // Prevent infinite loop - only retry once
                              if (!target.dataset.fallbackTried) {
                                target.dataset.fallbackTried = 'true';
                                // Retry with original image
                                target.src = originalFileUrl;
                                return;
                              }
                            }
                            
                            // If original also fails or no fallback available, show download link
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
                          className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                          style={{ display: 'none' }}
                        >
                          <Paperclip className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{message.fileName || 'Image'}</p>
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
                          className="max-w-full max-h-96 rounded-lg"
                          poster={message.thumbnailUrl ? getMediaUrl(message.thumbnailUrl) ?? undefined : undefined}
                        />
                      </div>
                    )}
                    {messageType === MessageType.AUDIO && (
                      <div className="mb-1">
                        <audio
                          src={fileUrl}
                          controls
                          className="w-full"
                        />
                      </div>
                    )}
                    {(messageType === MessageType.FILE || !messageType) && fileUrl && (
                      <a
                        href={fileUrl}
                        download={message.fileName}
                        className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      >
                        <Paperclip className="w-4 h-4" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{message.fileName || 'File'}</p>
                          {message.fileSize && (
                            <p className="text-xs text-gray-500">
                              {(message.fileSize / 1024).toFixed(2)} KB
                            </p>
                          )}
                        </div>
                      </a>
                    )}
                  </div>
                )}
                
                {message.content && (
                  <p className="break-words text-[15px] leading-[1.4]">{message.content}</p>
                )}
                
                {/* Превью ссылки */}
                {message.linkPreview && typeof message.linkPreview === 'object' && (
                  <div className="mt-2">
                    <LinkPreview preview={message.linkPreview} messageId={message.id} />
                  </div>
                )}
                
                {/* Таймер самоуничтожения */}
                {message.expiresAt && (
                  <div className="mt-1">
                    <SelfDestructTimer
                      expiresAt={message.expiresAt}
                      onExpire={() => {
                        deleteMessageFromStore(message.id);
                      }}
                    />
                  </div>
                )}
                
                <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-xs ${isOwn ? 'text-[#667781] dark:text-[#8696a0]' : 'text-[#667781] dark:text-[#8696a0]'}`}>
                    {formatMessageTime(message.createdAt)}
                  </span>
                  {message.isEdited && (
                    <span className={`text-xs ${isOwn ? 'text-[#667781] dark:text-[#8696a0]' : 'text-[#667781] dark:text-[#8696a0]'}`}>
                      (edited)
                    </span>
                  )}
                  {isOwn && (
                    <MessageStatus 
                      isSent={message.isSent || false} 
                      isRead={message.isRead || false} 
                      isOwn={true} 
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Индикаторы печати */}
        {Array.from(typingUsers.entries()).map(([userId, userInfo]) => (
          <div key={userId} className="flex justify-start mb-1">
            <TypingIndicator 
              username={userInfo.displayName || userInfo.username} 
            />
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="px-2 md:px-4 py-2 md:py-3 border-t border-gray-200 dark:border-[#202c33] bg-[#f0f2f5] dark:bg-[#202c33]">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
            className="p-1.5 md:p-2 hover:bg-gray-200 dark:hover:bg-[#2a3942] rounded-full transition flex-shrink-0"
            title="Голосовое сообщение"
          >
            <Mic className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
          </button>
          <button
            type="button"
            onClick={handleFileButtonClick}
            className="p-1.5 md:p-2 hover:bg-gray-200 dark:hover:bg-[#2a3942] rounded-full transition flex-shrink-0"
            title="Прикрепить файл"
          >
            <Paperclip className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
          </button>
          <div className="relative hidden md:block">
            <button
              ref={selfDestructButtonRef}
              type="button"
              onClick={() => setShowSelfDestructOptions(!showSelfDestructOptions)}
              className={`p-2 hover:bg-gray-200 dark:hover:bg-[#2a3942] rounded-full transition ${
                selfDestructSeconds ? 'bg-[#00a884]/20 text-[#00a884]' : ''
              }`}
              title="Самоуничтожающееся сообщение"
            >
              <Clock className="w-5 h-5" />
            </button>
            {showSelfDestructOptions && (
              <SelfDestructOptions
                onSelect={(seconds) => {
                  setSelfDestructSeconds(seconds);
                  setShowSelfDestructOptions(false);
                }}
                onClose={() => setShowSelfDestructOptions(false)}
              />
            )}
          </div>
          
          <input
            type="text"
            value={messageInput}
            onChange={handleTyping}
            placeholder="Сообщение"
            className="flex-1 min-w-0 px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-[#2a3942] border-none rounded-full focus:outline-none text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] text-[15px]"
            onKeyDown={(e) => {
              // Отправка сообщения по Enter (без Shift)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          
          <EmojiInput onEmojiSelect={handleEmojiSelect} />
          
          <button
            type="submit"
            className="p-1.5 md:p-2 bg-[#00a884] dark:bg-[#00a884] text-white rounded-full hover:bg-[#008069] dark:hover:bg-[#008069] transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            disabled={!messageInput.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
      </div>

      {showChatProfile && (
        <div className="hidden lg:block lg:w-[380px] lg:shrink-0">
          <ChatProfileDrawer
            chat={currentChat}
            currentUserId={user?.id || ''}
            variant="docked"
            onClose={() => setShowChatProfile(false)}
            onStartCall={(type) => {
              setShowChatProfile(false);
              handleStartCall(type);
            }}
          />
        </div>
      )}

      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAnswer={handleAnswerCall}
          onReject={handleRejectCall}
        />
      )}

      {showCallModal && activeCallId && (
        <CallModal
          callId={activeCallId}
          chatId={chatId}
          callType={callType}
          isInitiator={isInitiator}
          onClose={() => {
            setShowCallModal(false);
            setActiveCallId(null);
          }}
        />
      )}

      {showForwardModal && forwardMessageId && (
        <ForwardMessageModal
          messageId={forwardMessageId}
          onClose={() => {
            setShowForwardModal(false);
            setForwardMessageId(null);
          }}
        />
      )}

      {showSearch && (
        <MessageSearch
          chatId={chatId}
          onSelectMessage={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showVoiceRecorder && (
        <div className="px-4 py-2">
          <VoiceRecorder
            onSend={handleVoiceSend}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white dark:bg-[#202c33] rounded-lg shadow-xl py-1 min-w-[160px] max-w-[calc(100vw-16px)]"
            style={{ 
              left: Math.min(contextMenu.x, window.innerWidth - 180), 
              top: Math.min(contextMenu.y, window.innerHeight - 200) 
            }}
          >
            {(() => {
              const message = messages.find((m) => m.id === contextMenu.messageId);
              if (!message) return null;
              const isOwn = !message.botId && message.senderId === user?.id;

              return (
                <>
                    <button
                      onClick={() => handleCopyMessage(message)}
                      className="w-full px-4 py-2 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-gray-100 dark:hover:bg-[#2a3942] flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Копировать
                    </button>
                    <button
                      onClick={() => handleForwardMessage(message.id)}
                      className="w-full px-4 py-2 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-gray-100 dark:hover:bg-[#2a3942] flex items-center gap-2"
                    >
                      <Forward className="w-4 h-4" />
                      Переслать
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handlePinMessage(message.id)}
                        className="w-full px-4 py-2 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-gray-100 dark:hover:bg-[#2a3942] flex items-center gap-2"
                      >
                        <Pin className="w-4 h-4" />
                        Закрепить
                      </button>
                    )}
                    {isOwn && (
                      <>
                        <button
                          onClick={() => handleEditMessage(message)}
                          className="w-full px-4 py-2 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-gray-100 dark:hover:bg-[#2a3942] flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#2a3942] flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </button>
                      </>
                    )}
                  </>
              );
            })()}
          </div>
        </>
      )}

      {showChatSettings && (
        <ChatSettingsDrawer
          chatId={chatId}
          chatName={chatName}
          notificationLevel={chatSettings?.notificationLevel ?? NotificationLevel.ALL}
          isMuted={chatSettings?.isMuted || false}
          folders={folders}
          selectedFolderId={chatSettings?.folderId ?? null}
          onUpdateNotificationLevel={handleUpdateNotificationLevel}
          onUpdateFolder={handleUpdateFolder}
          onClose={() => setShowChatSettings(false)}
        />
      )}

      {showChatProfile && (
        <div className="lg:hidden">
          <ChatProfileDrawer
            chat={currentChat}
            currentUserId={user?.id || ''}
            variant="overlay"
            onClose={() => setShowChatProfile(false)}
            onStartCall={(type) => {
              setShowChatProfile(false);
              handleStartCall(type);
            }}
          />
        </div>
      )}
    </div>
  );
}
