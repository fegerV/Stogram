"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVapidKeys = exports.sendCallNotification = exports.sendNewMessageNotification = exports.sendPushNotificationToMultiple = exports.sendPushNotification = exports.savePushSubscription = void 0;
const web_push_1 = __importDefault(require("web-push"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// Configure web push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@stogram.com';
if (vapidPublicKey && vapidPrivateKey) {
    web_push_1.default.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}
/**
 * Save push subscription for a user
 */
const savePushSubscription = async (userId, subscription) => {
    try {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { pushSubscription: subscription },
        });
    }
    catch (error) {
        console.error('Error saving push subscription:', error);
        throw error;
    }
};
exports.savePushSubscription = savePushSubscription;
/**
 * Send push notification to a user
 */
const sendPushNotification = async (userId, payload) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { pushSubscription: true },
        });
        if (!user || !user.pushSubscription) {
            return;
        }
        const subscription = JSON.parse(user.pushSubscription);
        await web_push_1.default.sendNotification(subscription, JSON.stringify(payload));
    }
    catch (error) {
        console.error('Error sending push notification:', error);
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
            await prisma_1.default.user.update({
                where: { id: userId },
                data: { pushSubscription: null },
            });
        }
    }
};
exports.sendPushNotification = sendPushNotification;
/**
 * Send push notification to multiple users
 */
const sendPushNotificationToMultiple = async (userIds, payload) => {
    const promises = userIds.map((userId) => (0, exports.sendPushNotification)(userId, payload));
    await Promise.allSettled(promises);
};
exports.sendPushNotificationToMultiple = sendPushNotificationToMultiple;
/**
 * Send new message notification
 */
const sendNewMessageNotification = async (userId, senderName, messageContent, chatId) => {
    await (0, exports.sendPushNotification)(userId, {
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
exports.sendNewMessageNotification = sendNewMessageNotification;
/**
 * Send call notification
 */
const sendCallNotification = async (userId, callerName, callType, callId) => {
    await (0, exports.sendPushNotification)(userId, {
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
exports.sendCallNotification = sendCallNotification;
/**
 * Generate VAPID keys (for initial setup)
 */
const generateVapidKeys = () => {
    return web_push_1.default.generateVAPIDKeys();
};
exports.generateVapidKeys = generateVapidKeys;
//# sourceMappingURL=pushService.js.map