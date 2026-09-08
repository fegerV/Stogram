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
export declare const savePushSubscription: (userId: string, subscription: string) => Promise<void>;
/**
 * Send push notification to a user
 */
export declare const sendPushNotification: (userId: string, payload: PushNotificationPayload) => Promise<void>;
/**
 * Send push notification to multiple users
 */
export declare const sendPushNotificationToMultiple: (userIds: string[], payload: PushNotificationPayload) => Promise<void>;
/**
 * Send new message notification
 */
export declare const sendNewMessageNotification: (userId: string, senderName: string, messageContent: string, chatId: string) => Promise<void>;
/**
 * Send call notification
 */
export declare const sendCallNotification: (userId: string, callerName: string, callType: "audio" | "video", callId: string) => Promise<void>;
/**
 * Generate VAPID keys (for initial setup)
 */
export declare const generateVapidKeys: () => {
    publicKey: string;
    privateKey: string;
};
//# sourceMappingURL=pushService.d.ts.map