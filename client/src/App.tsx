import { useEffect, Suspense, lazy, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DevPerformanceMonitor } from './components/DevPerformanceMonitor';
import { performanceMonitor } from './utils/performance';
import { preloadCriticalComponents, preloadByRoute, initializePrefetchStrategies } from './components/LazyComponents';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { socketService } from './services/socket';

// Lazy load pages for better code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(module => ({ default: module.VerifyEmailPage })));
const TelegramSettingsPage = lazy(() => import('./pages/TelegramSettingsPage').then(module => ({ default: module.TelegramSettingsPage })));
const TelegramMiniApp = lazy(() => import('./pages/TelegramMiniApp').then(module => ({ default: module.TelegramMiniApp })));
const PerformanceWidget = lazy(() => import('./components/PerformanceWidget').then(module => ({ default: module.PerformanceWidget })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const ENABLE_PERFORMANCE_WIDGET = import.meta.env.VITE_ENABLE_PERFORMANCE_WIDGET !== 'false';

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
  const { initializeTheme, theme, setTheme } = useThemeStore();

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
        <DevPerformanceMonitor />
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
            <PerformanceWidget position="bottom-right" />
          </Suspense>
        )}
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
