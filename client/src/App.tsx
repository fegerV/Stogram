import { useEffect, Suspense, lazy, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DevPerformanceMonitor } from './components/DevPerformanceMonitor';
import { performanceMonitor } from './utils/performance';
import { preloadCriticalComponents, preloadByRoute, initializePrefetchStrategies } from './components/LazyComponents';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { socketService } from './services/socket';
import { userApi } from './services/api';
import { checkPushSubscription, subscribeToPushNotifications } from './utils/pushNotifications';

// Lazy load pages for better code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(module => ({ default: module.VerifyEmailPage })));
const TelegramSettingsPage = lazy(() => import('./pages/TelegramSettingsPage').then(module => ({ default: module.TelegramSettingsPage })));
const TelegramMiniApp = lazy(() => import('./pages/TelegramMiniApp').then(module => ({ default: module.TelegramMiniApp })));
const N8nSettings = lazy(() => import('./pages/N8nSettings').then(module => ({ default: module.default })));
const BotSettings = lazy(() => import('./pages/BotSettings').then(module => ({ default: module.default })));
const PerformanceWidget = lazy(() => import('./components/PerformanceWidget').then(module => ({ default: module.PerformanceWidget })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const ENABLE_PERFORMANCE_WIDGET = import.meta.env.VITE_ENABLE_PERFORMANCE_WIDGET === 'true';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function RoutePreloader() {
  const location = useLocation();

  useEffect(() => {
    // Preload based on current route
    preloadByRoute(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { initializeTheme, theme } = useThemeStore();
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const installToastRef = useRef<string | null>(null);
  const updateToastRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.trackInteraction('app_init', 'App');
    
    // Initialize prefetch strategies
    initializePrefetchStrategies();
    
    // Preload critical components after initial render
    const timer = setTimeout(() => {
      preloadCriticalComponents();
    }, 1000);

    loadUser();
    initializeTheme();

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle system theme changes
  const initializeThemeRef = useRef(initializeTheme);
  initializeThemeRef.current = initializeTheme;

  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Re-initialize theme when system theme changes
      initializeThemeRef.current();
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        performanceMonitor.trackInteraction('socket_connect', 'SocketService');
        socketService.connect(token);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const syncExistingSubscription = async () => {
      try {
        const subscription = await checkPushSubscription();
        if (!subscription) {
          return;
        }

        await userApi.subscribeToPush(subscription);
      } catch (error) {
        console.error('Failed to sync push subscription:', error);
      }
    };

    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'PWA_PUSH_SUBSCRIPTION_CHANGED' && event.data.subscription) {
        try {
          await userApi.subscribeToPush(event.data.subscription);
        } catch (error) {
          console.error('Failed to sync renewed push subscription:', error);
        }
      }

      if (event.data?.type === 'PWA_PUSH_SUBSCRIPTION_EXPIRED' && import.meta.env.VITE_VAPID_PUBLIC_KEY) {
        try {
          await subscribeToPushNotifications(import.meta.env.VITE_VAPID_PUBLIC_KEY);
        } catch (error) {
          console.error('Failed to recreate expired push subscription:', error);
        }
      }
    };

    syncExistingSubscription();
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as BeforeInstallPromptEvent;

      if (installToastRef.current) {
        return;
      }

      installToastRef.current = toast.custom((toastInstance) => (
        <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 shadow-2xl">
          <div className="flex-1">
            <div className="text-sm font-semibold">Установить Stogram</div>
            <div className="text-xs text-slate-400">Приложение будет запускаться как отдельное окно и лучше работать офлайн.</div>
          </div>
          <button
            className="rounded-full bg-[#3390ec] px-3 py-1 text-sm font-medium text-white"
            onClick={async () => {
              const deferredPrompt = installPromptRef.current;
              toast.dismiss(toastInstance.id);
              installToastRef.current = null;

              if (!deferredPrompt) {
                return;
              }

              await deferredPrompt.prompt();
              await deferredPrompt.userChoice;
              installPromptRef.current = null;
            }}
          >
            Установить
          </button>
        </div>
      ), {
        duration: Infinity,
      });
    };

    const handleOfflineReady = () => {
      toast.success('Stogram готов к офлайн-работе.');
    };

    const handleUpdateAvailable = () => {
      if (updateToastRef.current) {
        return;
      }

      updateToastRef.current = toast.custom((toastInstance) => (
        <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 shadow-2xl">
          <div className="flex-1">
            <div className="text-sm font-semibold">Доступно обновление</div>
            <div className="text-xs text-slate-400">Перезагрузи приложение, чтобы включить новую версию.</div>
          </div>
          <button
            className="rounded-full bg-[#3390ec] px-3 py-1 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
          >
            Обновить
          </button>
        </div>
      ), {
        duration: Infinity,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('stogram:pwa-offline-ready', handleOfflineReady);
    window.addEventListener('stogram:pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('stogram:pwa-offline-ready', handleOfflineReady);
      window.removeEventListener('stogram:pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884] dark:border-[#00a884]"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        performanceMonitor.trackInteraction('app_error', 'AppBoundary');
        console.error('Application error:', error, errorInfo);
      }}
    >
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <RoutePreloader />
        <Toaster position="top-right" />
        <div className="hidden md:block">
          <DevPerformanceMonitor />
        </div>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884] dark:border-[#00a884]"></div>
          </div>
        }>
          <Routes>
            <Route
              path="/login"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
                </ErrorBoundary>
              }
            />
            <Route
              path="/register"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <Navigate to="/" /> : <RegisterPage />}
                </ErrorBoundary>
              }
            />
            <Route 
              path="/verify-email" 
              element={
                <ErrorBoundary>
                  <VerifyEmailPage />
                </ErrorBoundary>
              } 
            />
            <Route
              path="/telegram/settings"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <TelegramSettingsPage /> : <Navigate to="/login" />}
                </ErrorBoundary>
              }
            />
            <Route
              path="/telegram/mini-app"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <TelegramMiniApp /> : <Navigate to="/login" />}
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <AnalyticsDashboard /> : <Navigate to="/login" />}
                </ErrorBoundary>
              }
            />
            <Route
              path="/n8n"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <N8nSettings /> : <Navigate to="/login" />}
                </ErrorBoundary>
              }
            />
            <Route
              path="/bot"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <BotSettings /> : <Navigate to="/login" />}
                </ErrorBoundary>
              }
            />
            <Route
              path="/*"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <ChatPage /> : <Navigate to="/login" />}
                </ErrorBoundary>
              }
            />
          </Routes>
        </Suspense>
        {ENABLE_PERFORMANCE_WIDGET && (
          <Suspense fallback={null}>
            <div className="hidden md:block">
              <PerformanceWidget position="bottom-right" />
            </div>
          </Suspense>
        )}
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
