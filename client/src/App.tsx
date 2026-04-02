import { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfirmDialogProvider } from './components/confirm/ConfirmDialogProvider';
import { performanceMonitor } from './utils/performance';
import { initializePrefetchStrategies, preloadByRoute } from './components/LazyComponents';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { socketService } from './services/socket';
import { usePwaLifecycle } from './hooks/usePwaLifecycle';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const VerifyEmailPage = lazy(() =>
  import('./pages/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage })),
);
const TelegramSettingsPage = lazy(() =>
  import('./pages/TelegramSettingsPage').then((module) => ({ default: module.TelegramSettingsPage })),
);
const TelegramMiniApp = lazy(() =>
  import('./pages/TelegramMiniApp').then((module) => ({ default: module.TelegramMiniApp })),
);
const N8nSettings = lazy(() => import('./pages/N8nSettings').then((module) => ({ default: module.default })));
const BotSettings = lazy(() => import('./pages/BotSettings').then((module) => ({ default: module.default })));
const PerformanceWidget = lazy(() =>
  import('./components/PerformanceWidget').then((module) => ({ default: module.PerformanceWidget })),
);
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const DevPerformanceMonitor = lazy(() =>
  import('./components/DevPerformanceMonitor').then((module) => ({ default: module.DevPerformanceMonitor })),
);

const ENABLE_PERFORMANCE_WIDGET = import.meta.env.VITE_ENABLE_PERFORMANCE_WIDGET === 'true';
const ENABLE_DEV_MONITOR = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_MONITOR === 'true';

function RoutePreloader() {
  const location = useLocation();

  useEffect(() => {
    preloadByRoute(location.pathname);
  }, [location.pathname]);

  return null;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884] dark:border-[#00a884]"></div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { initializeTheme, theme } = useThemeStore();
  const initializeThemeRef = useRef(initializeTheme);
  initializeThemeRef.current = initializeTheme;

  usePwaLifecycle(isAuthenticated);

  useEffect(() => {
    performanceMonitor.trackInteraction('app_init', 'App');
    loadUser();
    initializeTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    initializePrefetchStrategies();
  }, [isAuthenticated]);

  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      initializeThemeRef.current();
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    performanceMonitor.trackInteraction('socket_connect', 'SocketService');
    socketService.connect(token);
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen />;
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
        <ConfirmDialogProvider>
          <RoutePreloader />
          <Toaster position="top-right" />
          {ENABLE_DEV_MONITOR && (
            <Suspense fallback={null}>
              <div className="hidden md:block">
                <DevPerformanceMonitor />
              </div>
            </Suspense>
          )}
          <Suspense fallback={<LoadingScreen />}>
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
        </ConfirmDialogProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
