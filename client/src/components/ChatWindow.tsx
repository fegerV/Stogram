import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Phone, Video, MoreVertical, Smile } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';
import { getChatName, formatMessageTime, getInitials } from '../utils/helpers';
import CallModal from './CallModal';

interface ChatWindowProps {
  chatId: string;
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const { currentChat, messages, selectChat, sendMessage } = useChatStore();
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'AUDIO' | 'VIDEO'>('AUDIO');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    selectChat(chatId);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setMessageInput('');
    socketService.typing(chatId, false);
    
    await sendMessage(chatId, content);
  };

  const handleStartCall = (type: 'AUDIO' | 'VIDEO') => {
    setCallType(type);
    setShowCallModal(true);
    socketService.initiateCall(chatId, type);
  };

  if (!currentChat) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const chatName = getChatName(currentChat, user?.id || '');

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
              {getInitials(chatName)}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{chatName}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartCall('AUDIO')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => handleStartCall('VIDEO')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin">
        {messages.map((message) => {
          const isOwn = message.senderId === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 shadow'
                }`}
              >
                {!isOwn && currentChat.type !== 'PRIVATE' && (
                  <p className="text-xs font-semibold mb-1 text-primary-600">
                    {message.sender.displayName || message.sender.username}
                  </p>
                )}
                <p className="break-words">{message.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className={`text-xs ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
                    {formatMessageTime(message.createdAt)}
                  </span>
                  {message.isEdited && (
                    <span className={`text-xs ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
                      (edited)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          
          <input
            type="text"
            value={messageInput}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <Smile className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            type="submit"
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {showCallModal && (
        <CallModal
          chatId={chatId}
          callType={callType}
          onClose={() => setShowCallModal(false)}
        />
      )}
    </div>
  );
}
