import { userApi } from '../services/api';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const subscribeToPushNotifications = async (
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  try {
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission denied');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to server
    await userApi.subscribeToPush(subscription);

    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

export const unsubscribeFromPushNotifications = async (): Promise<void> => {
  try {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('Push notification unsubscribed');
    }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
  }
};

export const checkPushSubscription = async (): Promise<PushSubscription | null> => {
  try {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return null;
  }
};
