import { useEffect, useCallback, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { usePerformanceMonitor } from '../utils/performance';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { socketService } from '../services/socket';
import { notificationSound } from '../utils/notificationSound';
import { Message } from '../types';

export default function ChatPage() {
  const { loadChats, addMessage, updateMessage: updateMessageInStore } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { startRender, trackInteraction } = usePerformanceMonitor('ChatPage');

  // Unlock audio context on first user interaction (required by browsers)
  const handleUserInteraction = useCallback(() => {
    notificationSound.unlock();
    document.removeEventListener('click', handleUserInteraction);
    document.removeEventListener('keydown', handleUserInteraction);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [handleUserInteraction]);

  useEffect(() => {
    startRender();
    trackInteraction('chat_page_load', 'ChatPage');
    
    const startTime = performance.now();
    loadChats().finally(() => {
      const duration = performance.now() - startTime;
      trackInteraction('chats_loaded', 'ChatList', duration);
    });

    socketService.on('message:new', (message: Message) => {
      trackInteraction('message_received', 'SocketService');
      addMessage(message);

      // Play notification sound for messages from other users
      const currentUser = useAuthStore.getState().user;
      const { soundEnabled } = useNotificationStore.getState();
      if (soundEnabled && currentUser && message.senderId !== currentUser.id) {
        notificationSound.playMessageSound();
      }

      // Show browser notification if tab is not focused
      if (document.hidden && currentUser && message.senderId !== currentUser.id) {
        const senderName = message.sender?.displayName || message.sender?.username || 'New message';
        const body = message.content || (message.fileUrl ? '📎 File' : 'New message');
        try {
          if (Notification.permission === 'granted') {
            new Notification(senderName, { body, icon: '/favicon.ico', tag: message.id });
          }
        } catch { /* ignore notification errors */ }
      }
    });

    socketService.on('message:update', (message: Message) => {
      trackInteraction('message_updated', 'SocketService');
      // Update message in store (for link previews, etc.)
      updateMessageInStore(message.id, message as any);
    });

    socketService.on('user:status', ({ userId, status }) => {
      trackInteraction('status_update', 'SocketService');
      console.log('User status update:', userId, status);
    });

    return () => {
      socketService.off('message:new');
      socketService.off('message:update');
      socketService.off('user:status');
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        trackInteraction('chat_page_error', 'ChatPage');
        console.error('ChatPage error:', error, errorInfo);
      }}
    >
      <div className="flex h-screen bg-white dark:bg-[#0b141a]">
        {/* ChatList: visible on mobile when no chat selected, always visible on desktop */}
        <div className={`w-full md:w-96 border-r border-gray-200 dark:border-[#202c33] bg-white dark:bg-[#0b141a] ${selectedChatId ? 'hidden md:block' : 'block'}`}>
          <ErrorBoundary>
            <ChatList 
              onSelectChat={(chatId) => {
                trackInteraction('chat_selected', 'ChatList');
                setSelectedChatId(chatId);
              }} 
              selectedChatId={selectedChatId} 
            />
          </ErrorBoundary>
        </div>
        
        {/* ChatWindow: visible on mobile when chat selected, always visible on desktop */}
        <div className={`flex-1 ${selectedChatId ? 'block' : 'hidden md:block'}`}>
          {selectedChatId ? (
            <ErrorBoundary>
              <ChatWindow 
                chatId={selectedChatId} 
                onBack={() => setSelectedChatId(null)} 
              />
            </ErrorBoundary>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-[#efeae2] dark:bg-[#0b141a]">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-xl">Выберите чат</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
