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

// Preload functions for critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  import('./UserSettings');
  import('./ChatWindow');
  import('./ChatList');
};

// Preload authenticated user components
export const preloadAuthenticatedComponents = () => {
  // Components likely needed after login
  import('../pages/ChatPage');
  import('./ChatList');
  import('./ChatWindow');
  import('./UserSettings');
};

// Preload page components for faster navigation
export const preloadPages = {
  chat: () => import('../pages/ChatPage'),
  login: () => import('../pages/LoginPage'),
  register: () => import('../pages/RegisterPage'),
  verify: () => import('../pages/VerifyEmailPage'),
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
};

// Intelligent preloading based on route
export const preloadByRoute = (currentRoute: string) => {
  switch (currentRoute) {
    case '/login':
      // Preload register page and chat page
      preloadPages.register();
      preloadPages.chat();
      break;
    case '/register':
      // Preload login and verify pages
      preloadPages.login();
      preloadPages.verify();
      break;
    case '/':
      // Preload settings and other chat-related components
      preloadCriticalComponents();
      break;
    default:
      break;
  }
};