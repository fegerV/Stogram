import { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DevPerformanceMonitor } from './components/DevPerformanceMonitor';
import { performanceMonitor } from './utils/performance';
import { preloadCriticalComponents } from './components/LazyComponents';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { socketService } from './services/socket';

function App() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.trackInteraction('app_init', 'App');
    
    // Preload critical components after initial render
    const timer = setTimeout(() => {
      preloadCriticalComponents();
    }, 1000);

    loadUser();
    initializeTheme();

    return () => clearTimeout(timer);
  }, []);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
      <BrowserRouter>
        <Toaster position="top-right" />
        <DevPerformanceMonitor />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
              path="/*"
              element={
                <ErrorBoundary>
                  {isAuthenticated ? <ChatPage /> : <Navigate to="/login" />}
                </ErrorBoundary>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
