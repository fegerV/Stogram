import { createLazyComponent } from '../utils/lazyLoading';

// Lazy load heavy components
export const LazyUserSettings = createLazyComponent(
  () => import('./UserSettings'),
  { fallback: <div className="p-8 text-center">Loading Settings...</div> }
);

export const LazyBotManager = createLazyComponent(
  () => import('./BotManager'),
  { fallback: <div className="p-8 text-center">Loading Bot Manager...</div> }
);

export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('./AnalyticsDashboard'),
  { fallback: <div className="p-8 text-center">Loading Analytics...</div> }
);

export const LazyChatFolders = createLazyComponent(
  () => import('./ChatFolders'),
  { fallback: <div className="p-8 text-center">Loading Chat Folders...</div> }
);

export const LazyThemeCustomizer = createLazyComponent(
  () => import('./ThemeCustomizer'),
  { fallback: <div className="p-8 text-center">Loading Theme Customizer...</div> }
);

export const LazyTwoFactorAuth = createLazyComponent(
  () => import('./TwoFactorAuth'),
  { fallback: <div className="p-8 text-center">Loading Two-Factor Auth...</div> }
);

export const LazyPrivacySettings = createLazyComponent(
  () => import('./PrivacySettings'),
  { fallback: <div className="p-8 text-center">Loading Privacy Settings...</div> }
);

export const LazyArchivedChats = createLazyComponent(
  () => import('./ArchivedChats'),
  { fallback: <div className="p-8 text-center">Loading Archived Chats...</div> }
);

export const LazyBlockedUsers = createLazyComponent(
  () => import('./BlockedUsers'),
  { fallback: <div className="p-8 text-center">Loading Blocked Users...</div> }
);

export const LazyCallModal = createLazyComponent(
  () => import('./CallModal'),
  { fallback: <div className="p-8 text-center">Loading Call...</div> }
);

export const LazyMediaViewer = createLazyComponent(
  () => import('./MediaViewer'),
  { fallback: <div className="p-8 text-center">Loading Media...</div> }
);

export const LazyVoiceRecorder = createLazyComponent(
  () => import('./VoiceRecorder'),
  { fallback: <div className="p-8 text-center">Loading Voice Recorder...</div> }
);

export const LazyVirtualizedList = createLazyComponent(
  () => import('./VirtualizedList'),
  { fallback: <div className="p-8 text-center">Loading List...</div> }
);

export const LazyPerformanceDashboard = createLazyComponent(
  () => import('./PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard })),
  { fallback: <div className="p-8 text-center">Loading Performance Dashboard...</div> }
);

export const LazyNewChatModal = createLazyComponent(
  () => import('./NewChatModal'),
  { fallback: <div className="p-8 text-center">Loading New Chat...</div> }
);

export const LazyEmojiPicker = createLazyComponent(
  () => import('emoji-picker-react'),
  { fallback: <div className="p-8 text-center">Loading Emoji Picker...</div> }
);

// Route-based lazy components
export const LazyLoginPage = createLazyComponent(
  () => import('../pages/LoginPage'),
  { fallback: <div className="min-h-screen flex items-center justify-center">Loading Login...</div> }
);

export const LazyRegisterPage = createLazyComponent(
  () => import('../pages/RegisterPage'),
  { fallback: <div className="min-h-screen flex items-center justify-center">Loading Register...</div> }
);

export const LazyTelegramSettingsPage = createLazyComponent(
  () => import('../pages/TelegramSettingsPage'),
  { fallback: <div className="min-h-screen flex items-center justify-center">Loading Telegram Settings...</div> }
);

export const LazyTelegramMiniApp = createLazyComponent(
  () => import('../pages/TelegramMiniApp'),
  { fallback: <div className="min-h-screen flex items-center justify-center">Loading Mini App...</div> }
);

// Preload functions for critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  import('./UserSettings');
  import('./ChatWindow');
  import('./ChatList');
};

// Preload on hover or user interaction
export const preloadOnInteraction = () => {
  // Preload when user is likely to access settings
  const settingsButtons = document.querySelectorAll('[data-settings-trigger]');
  settingsButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      import('./UserSettings');
    }, { once: true });
  });

  // Preload analytics when user might access it
  const analyticsTriggers = document.querySelectorAll('[data-analytics-trigger]');
  analyticsTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => {
      import('./AnalyticsDashboard');
    }, { once: true });
  });

  // Preload bot manager when hovering over bot-related elements
  const botTriggers = document.querySelectorAll('[data-bot-trigger]');
  botTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => {
      import('./BotManager');
    }, { once: true });
  });
};

// Prefetch chunks for better performance
export const prefetchChunks = () => {
  // Prefetch auth-related chunks
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('../pages/LoginPage');
      import('../pages/RegisterPage');
      import('../pages/VerifyEmailPage');
    });
  }
};

// Intersection Observer for prefetching components when they come into viewport
export const setupViewportPrefetching = () => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const componentName = element.dataset.prefetch;
          
          if (componentName) {
            switch (componentName) {
              case 'analytics':
                import('./AnalyticsDashboard');
                break;
              case 'settings':
                import('./UserSettings');
                break;
              case 'bots':
                import('./BotManager');
                break;
              case 'media':
                import('./MediaViewer');
                break;
              case 'voice':
                import('./VoiceRecorder');
                break;
            }
            observer.unobserve(element);
          }
        }
      });
    }, { rootMargin: '50px' });

    // Observe elements with prefetch data attributes
    document.querySelectorAll('[data-prefetch]').forEach(element => {
      observer.observe(element);
    });
  }
};