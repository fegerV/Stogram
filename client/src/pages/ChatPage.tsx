import { useEffect, useState } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useChatStore } from '../store/chatStore';
import { socketService } from '../services/socket';
import { Message } from '../types';

export default function ChatPage() {
  const { loadChats, addMessage } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    loadChats();

    socketService.on('message:new', (message: Message) => {
      addMessage(message);
    });

    socketService.on('user:status', ({ userId, status }) => {
      console.log('User status update:', userId, status);
    });

    return () => {
      socketService.off('message:new');
      socketService.off('user:status');
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ChatList onSelectChat={setSelectedChatId} selectedChatId={selectedChatId} />
      </div>
      
      <div className="flex-1 hidden md:block">
        {selectedChatId ? (
          <ChatWindow chatId={selectedChatId} />
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
  );
}
