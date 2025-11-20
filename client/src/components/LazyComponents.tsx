import { createLazyComponent } from '../utils/lazyLoading';

const isBrowser = typeof window !== 'undefined';
const prefetchedComponents = new Set<string>();
let prefetchStrategiesInitialized = false;
let idlePrefetchScheduled = false;

const componentPrefetchers: Record<string, () => Promise<any>> = {
  settings: () => import('./UserSettings'),
  analytics: () => import('./AnalyticsDashboard'),
  bot: () => import('./BotManager'),
  performance: () => import('./PerformanceDashboard'),
  performanceWidget: () => import('./PerformanceWidget'),
  miniApp: () => import('../pages/TelegramMiniApp'),
  telegramSettings: () => import('../pages/TelegramSettingsPage'),
  theme: () => import('./ThemeCustomizer'),
  folders: () => import('./ChatFolders'),
  privacy: () => import('./PrivacySettings'),
  twoFactor: () => import('./TwoFactorAuth'),
  archived: () => import('./ArchivedChats'),
  blocked: () => import('./BlockedUsers'),
};

const idlePrefetchQueue: Array<() => Promise<any>> = [
  componentPrefetchers.analytics,
  componentPrefetchers.performance,
  componentPrefetchers.bot,
  componentPrefetchers.telegramSettings,
  componentPrefetchers.miniApp,
];

const runWhenIdle = (callback: () => void, timeout = 1500) => {
  if (!isBrowser) return;
  const idleCallback = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;

  if (typeof idleCallback === 'function') {
    idleCallback(callback, { timeout });
  } else {
    setTimeout(callback, timeout);
  }
};

const flushIdlePrefetchQueue = () => {
  if (!idlePrefetchQueue.length) return;
  const next = idlePrefetchQueue.shift();
  next?.();

  if (idlePrefetchQueue.length) {
    runWhenIdle(flushIdlePrefetchQueue, 2000);
  }
};

const prefetchByKey = (key: string | null | undefined) => {
  if (!key || prefetchedComponents.has(key)) return;
  const loader = componentPrefetchers[key];
  if (loader) {
    prefetchedComponents.add(key);
    loader();
  }
};

const resolvePrefetchKey = (element: Element | null): string | null => {
  if (!element) return null;

  const explicitKey =
    element.getAttribute('data-prefetch-key') ||
    element.getAttribute('data-prefetch') ||
    element.getAttribute('data-prefetch-on-hover') ||
    element.getAttribute('data-prefetch-on-interaction') ||
    element.getAttribute('data-prefetch-on-view');

  if (explicitKey) return explicitKey;

  if (element.matches('[data-settings-trigger]')) return 'settings';
  if (element.matches('[data-analytics-trigger]')) return 'analytics';
  if (element.matches('[data-bot-trigger]')) return 'bot';
  if (element.matches('[data-performance-trigger]')) return 'performance';
  if (element.matches('[data-miniapp-trigger]')) return 'miniApp';
  if (element.matches('[data-telegram-settings-trigger]')) return 'telegramSettings';

  return null;
};

const handlePrefetchEvent = (event: Event, attribute: string) => {
  const target = (event.target as HTMLElement | null)?.closest(attribute);
  if (!target) return;
  prefetchByKey(resolvePrefetchKey(target));
  target.setAttribute('data-prefetched', 'true');
};

const setupPrefetchHandlers = () => {
  if (!isBrowser) return;

  document.addEventListener(
    'pointerenter',
    event => handlePrefetchEvent(event, '[data-prefetch-on-hover], [data-settings-trigger], [data-analytics-trigger]'),
    true
  );

  document.addEventListener(
    'focusin',
    event => handlePrefetchEvent(event, '[data-prefetch-on-focus], [data-prefetch-on-interaction]'),
    true
  );

  document.addEventListener(
    'click',
    event => handlePrefetchEvent(event, '[data-prefetch-on-interaction]'),
    true
  );
};

const setupIntersectionPrefetch = () => {
  if (!isBrowser || !(window as any).IntersectionObserver) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          prefetchByKey(resolvePrefetchKey(element));
          observer.unobserve(element);
        }
      });
    },
    { rootMargin: '200px', threshold: 0.1 }
  );

  const observeElements = (root: ParentNode = document) => {
    root.querySelectorAll('[data-prefetch-on-view]').forEach(el => observer.observe(el));
  };

  observeElements();

  const mutationObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          if (node.matches('[data-prefetch-on-view]')) {
            observer.observe(node);
          }
          observeElements(node);
        }
      });
    });
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });
};

const scheduleIdlePrefetch = () => {
  if (!isBrowser || idlePrefetchScheduled) return;
  idlePrefetchScheduled = true;
  runWhenIdle(flushIdlePrefetchQueue, 2500);
};

export const initializePrefetchStrategies = () => {
  if (!isBrowser || prefetchStrategiesInitialized) return;
  prefetchStrategiesInitialized = true;
  setupPrefetchHandlers();
  setupIntersectionPrefetch();
  scheduleIdlePrefetch();
};

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

export const LazyPerformanceDashboard = createLazyComponent(
  () => import('./PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard })),
  { fallback: <div className="p-8 text-center">Loading Performance Data...</div> }
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

export const LazyTelegramSettingsPage = createLazyComponent(
  () => import('../pages/TelegramSettingsPage').then(module => ({ default: module.TelegramSettingsPage })),
  { fallback: <div className="p-8 text-center">Loading Telegram Settings...</div> }
);

export const LazyTelegramMiniApp = createLazyComponent(
  () => import('../pages/TelegramMiniApp').then(module => ({ default: module.TelegramMiniApp })),
  { fallback: <div className="p-8 text-center">Loading Telegram Mini App...</div> }
);

// Preload functions for critical components
export const preloadCriticalComponents = () => {
  import('./UserSettings');
  import('./ChatWindow');
  import('./ChatList');
  import('./PerformanceDashboard');
};

// Preload authenticated user components
export const preloadAuthenticatedComponents = () => {
  import('../pages/ChatPage');
  import('./ChatList');
  import('./ChatWindow');
  import('./UserSettings');
  import('./AnalyticsDashboard');
};

// Preload page components for faster navigation
export const preloadPages = {
  chat: () => import('../pages/ChatPage'),
  login: () => import('../pages/LoginPage'),
  register: () => import('../pages/RegisterPage'),
  verify: () => import('../pages/VerifyEmailPage'),
  telegramSettings: () => import('../pages/TelegramSettingsPage'),
  telegramMiniApp: () => import('../pages/TelegramMiniApp'),
};

// Backwards compatible interaction preload helper
export const preloadOnInteraction = () => {
  initializePrefetchStrategies();
};

// Intelligent preloading based on route
export const preloadByRoute = (currentRoute: string) => {
  const route = currentRoute.split('?')[0];

  switch (route) {
    case '/login':
      preloadPages.register();
      preloadPages.chat();
      break;
    case '/register':
      preloadPages.login();
      preloadPages.verify();
      break;
    case '/telegram/settings':
      preloadPages.telegramMiniApp();
      prefetchByKey('miniApp');
      break;
    case '/telegram/mini-app':
      preloadPages.telegramSettings();
      prefetchByKey('telegramSettings');
      break;
    default:
      break;
  }

  if (route === '/' || route.startsWith('/chat')) {
    preloadCriticalComponents();
    prefetchByKey('settings');
  }

  if (route.includes('settings')) {
    prefetchByKey('settings');
    prefetchByKey('privacy');
    preloadPages.telegramSettings();
  }

  if (route.includes('analytics')) {
    prefetchByKey('analytics');
  }
};
