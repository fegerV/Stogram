import webpush from 'web-push';
import prisma from '../utils/prisma';

// Configure web push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@stogram.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Save push subscription for a user
 */
export const savePushSubscription = async (
  userId: string,
  subscription: string
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { pushSubscription: subscription },
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
};

/**
 * Send push notification to a user
 */
export const sendPushNotification = async (
  userId: string,
  payload: PushNotificationPayload
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });

    if (!user || !user.pushSubscription) {
      return;
    }

    const subscription = JSON.parse(user.pushSubscription);

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    
    // If subscription is invalid, remove it
    if (error.statusCode === 410) {
      await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: null },
      });
    }
  }
};

/**
 * Send push notification to multiple users
 */
export const sendPushNotificationToMultiple = async (
  userIds: string[],
  payload: PushNotificationPayload
): Promise<void> => {
  const promises = userIds.map((userId) =>
    sendPushNotification(userId, payload)
  );

  await Promise.allSettled(promises);
};

/**
 * Send new message notification
 */
export const sendNewMessageNotification = async (
  userId: string,
  senderName: string,
  messageContent: string,
  chatId: string
): Promise<void> => {
  await sendPushNotification(userId, {
    title: senderName,
    body: messageContent || 'Sent a file',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      type: 'message',
      chatId,
    },
    tag: `chat-${chatId}`,
  });
};

/**
 * Send call notification
 */
export const sendCallNotification = async (
  userId: string,
  callerName: string,
  callType: 'audio' | 'video',
  callId: string
): Promise<void> => {
  await sendPushNotification(userId, {
    title: `${callerName} is calling`,
    body: `Incoming ${callType} call`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      type: 'call',
      callId,
      callType,
    },
    tag: `call-${callId}`,
    requireInteraction: true,
  });
};

/**
 * Generate VAPID keys (for initial setup)
 */
export const generateVapidKeys = (): {
  publicKey: string;
  privateKey: string;
} => {
  return webpush.generateVAPIDKeys();
};
