import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
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
    <div className="telegram-wallpaper flex h-full items-center justify-center">
      <div className="panel-soft flex h-16 w-16 items-center justify-center rounded-[22px]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/10 border-t-[#4ba3ff]" />
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { loadChats, addMessage, updateMessage: updateMessageInStore } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [isStandalone, setIsStandalone] = useState(false);
  const { startRender, trackInteraction } = usePerformanceMonitor('ChatPage');

  const pwaStatus = useMemo(
    () => ({
      isOnline,
      isStandalone,
      title: isStandalone ? 'PWA mode' : 'Web mode',
      description: isStandalone
        ? 'Приложение работает как отдельный мессенджер'
        : 'Можно установить на главный экран для более нативного опыта',
    }),
    [isOnline, isStandalone],
  );

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
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const syncStandaloneState = () => {
      const iosStandalone = 'standalone' in window.navigator
        ? Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
        : false;
      setIsStandalone(mediaQuery.matches || iosStandalone);
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    syncStandaloneState();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    mediaQuery.addEventListener('change', syncStandaloneState);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', syncStandaloneState);
    };
  }, []);

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
      updateMessageInStore(message.id, message as never);
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
  }, [addMessage, loadChats, startRender, trackInteraction, updateMessageInStore]);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        trackInteraction('chat_page_error', 'ChatPage');
        console.error('ChatPage error:', error, errorInfo);
      }}
    >
      <div className="app-shell flex h-screen overflow-hidden">
        <div className="floating-orb left-[-80px] top-[-100px] h-64 w-64 bg-[#4ba3ff]/20" />
        <div className="floating-orb bottom-[-120px] right-[-80px] h-72 w-72 bg-[#61d394]/10" />

        <div className="relative z-10 flex h-full w-full overflow-hidden">
          <div
            className={`relative z-10 w-full flex-shrink-0 md:w-[440px] xl:w-[500px] ${
              selectedChatId ? 'hidden md:block' : 'block'
            }`}
          >
            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <div className="flex h-full flex-col p-2 md:p-4">
                  <div className="panel-glass-strong mb-3 flex items-center justify-between gap-3 rounded-[28px] px-4 py-3 text-white md:hidden">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#8da4bb]">Stogram PWA</p>
                      <p className="truncate text-sm font-medium">{pwaStatus.description}</p>
                    </div>
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        pwaStatus.isStandalone ? 'bg-[#4ba3ff]/20 text-[#8cc6ff]' : 'bg-white/6 text-white/80'
                      }`}
                    >
                      {pwaStatus.isStandalone ? <ShieldCheck className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                    </div>
                  </div>

                  <div className="panel-glass-strong flex min-h-0 flex-1 overflow-hidden rounded-[32px]">
                    <ChatList
                      onSelectChat={(chatId) => {
                        trackInteraction('chat_selected', 'ChatList');
                        setSelectedChatId(chatId);
                      }}
                      selectedChatId={selectedChatId}
                    />
                  </div>
                </div>
              </Suspense>
            </ErrorBoundary>
          </div>

          <div className={`relative z-10 min-w-0 flex-1 p-2 md:p-4 ${selectedChatId ? 'block' : 'hidden md:block'}`}>
            {selectedChatId ? (
              <ErrorBoundary>
                <Suspense fallback={<SectionLoader />}>
                  <div className="panel-glass-strong h-full overflow-hidden rounded-[32px]">
                    <ChatWindow chatId={selectedChatId} onBack={() => setSelectedChatId(null)} />
                  </div>
                </Suspense>
              </ErrorBoundary>
            ) : (
              <div className="telegram-wallpaper panel-glass-strong flex h-full items-center justify-center rounded-[32px] px-6 text-white">
                <div className="max-w-md text-center">
                  <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[30px] bg-white/6 shadow-[0_18px_50px_rgba(7,17,27,0.35)]">
                    <div className="text-5xl">💬</div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#8da4bb]">Modern messaging</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">Выберите чат для начала</h2>
                  <p className="mt-3 text-sm leading-6 text-[#93abc1]">
                    Список слева уже готов для быстрых переходов, поиска и установки как PWA.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
                    <div className="panel-soft flex items-center gap-2 rounded-full px-4 py-2 text-[#d7ebff]">
                      {pwaStatus.isOnline ? <Wifi className="h-4 w-4 text-[#61d394]" /> : <WifiOff className="h-4 w-4 text-[#ff9c85]" />}
                      {pwaStatus.isOnline ? 'Онлайн' : 'Оффлайн'}
                    </div>
                    <div className="panel-soft flex items-center gap-2 rounded-full px-4 py-2 text-[#d7ebff]">
                      <ShieldCheck className="h-4 w-4 text-[#8cc6ff]" />
                      {pwaStatus.title}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
