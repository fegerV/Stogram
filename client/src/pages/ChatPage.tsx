import { useEffect, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { usePerformanceMonitor } from '../utils/performance';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useChatStore } from '../store/chatStore';
import { socketService } from '../services/socket';
import { Message } from '../types';

export default function ChatPage() {
  const { loadChats, addMessage } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { startRender, trackInteraction } = usePerformanceMonitor('ChatPage');

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
    });

    socketService.on('user:status', ({ userId, status }) => {
      trackInteraction('status_update', 'SocketService');
      console.log('User status update:', userId, status);
    });

    return () => {
      socketService.off('message:new');
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
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
        
        <div className="flex-1 hidden md:block">
          {selectedChatId ? (
            <ErrorBoundary>
              <ChatWindow chatId={selectedChatId} />
            </ErrorBoundary>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-xl">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
