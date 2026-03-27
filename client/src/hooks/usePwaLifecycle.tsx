import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { userApi } from '../services/api';
import { checkPushSubscription, subscribeToPushNotifications } from '../utils/pushNotifications';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const usePwaLifecycle = (isAuthenticated: boolean) => {
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const installToastRef = useRef<string | null>(null);
  const updateToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const syncExistingSubscription = async () => {
      try {
        const subscription = await checkPushSubscription();
        if (subscription) {
          await userApi.subscribeToPush(subscription);
        }
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
            <div className="text-xs text-slate-400">
              Приложение будет запускаться как отдельное окно и лучше работать офлайн.
            </div>
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
      ), { duration: Infinity });
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
            <div className="text-xs text-slate-400">
              Перезагрузи приложение, чтобы включить новую версию.
            </div>
          </div>
          <button
            className="rounded-full bg-[#3390ec] px-3 py-1 text-sm font-medium text-white"
            onClick={() => {
              toast.dismiss(toastInstance.id);
              updateToastRef.current = null;
              window.location.reload();
            }}
          >
            Обновить
          </button>
        </div>
      ), { duration: Infinity });
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
};
