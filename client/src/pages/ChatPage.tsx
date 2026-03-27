import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { usePerformanceMonitor } from '../utils/performance';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { socketService } from '../services/socket';
import { notificationSound } from '../utils/notificationSound';
import { Message } from '../types';

const ChatList = lazy(() => import('../components/ChatList'));
const ChatWindow = lazy(() => import('../components/ChatWindow'));

function SectionLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-[#0e1621]">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#00a884]" />
    </div>
  );
}

export default function ChatPage() {
  const { loadChats, addMessage, updateMessage: updateMessageInStore } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { startRender, trackInteraction } = usePerformanceMonitor('ChatPage');

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

      const currentUser = useAuthStore.getState().user;
      const { soundEnabled } = useNotificationStore.getState();
      if (soundEnabled && currentUser && message.senderId !== currentUser.id) {
        notificationSound.playMessageSound();
      }

      if (document.hidden && currentUser && message.senderId !== currentUser.id) {
        const senderName = message.sender?.displayName || message.sender?.username || 'Новое сообщение';
        const body = message.content || (message.fileUrl ? 'Файл' : 'Новое сообщение');
        try {
          if (Notification.permission === 'granted') {
            new Notification(senderName, { body, icon: '/favicon.ico', tag: message.id });
          }
        } catch {
          // ignore notification errors
        }
      }
    });

    socketService.on('message:update', (message: Message) => {
      trackInteraction('message_updated', 'SocketService');
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
      <div className="flex h-screen overflow-hidden bg-[#0b141a]">
        <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#0b141a]">
          <div
            className={`w-full flex-shrink-0 border-r border-gray-200 bg-white dark:border-[#202c33] dark:bg-[#0b141a] md:w-[500px] xl:w-[540px] ${
              selectedChatId ? 'hidden md:block' : 'block'
            }`}
          >
            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <ChatList
                  onSelectChat={(chatId) => {
                    trackInteraction('chat_selected', 'ChatList');
                    setSelectedChatId(chatId);
                  }}
                  selectedChatId={selectedChatId}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          <div className={`min-w-0 flex-1 ${selectedChatId ? 'block' : 'hidden md:block'}`}>
            {selectedChatId ? (
              <ErrorBoundary>
                <Suspense fallback={<SectionLoader />}>
                  <ChatWindow chatId={selectedChatId} onBack={() => setSelectedChatId(null)} />
                </Suspense>
              </ErrorBoundary>
            ) : (
              <div className="flex h-full items-center justify-center bg-[#dfe4e7] text-gray-400 dark:bg-[#0e1621] dark:text-gray-500">
                <div className="text-center">
                  <div className="mb-4 text-6xl opacity-40">💬</div>
                  <p className="text-lg font-medium text-[#707579] dark:text-[#6c7883]">Выберите чат для начала</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
