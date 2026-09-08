export interface ChatUnreadUpdate {
    userId: string;
    chatId: string;
    unreadCount: number;
    lastReadMessageId: string | null;
}
export declare const incrementUnreadForChatMembers: (chatId: string, senderId: string) => Promise<ChatUnreadUpdate[]>;
export declare const markChatReadThroughMessage: (chatId: string, userId: string, messageId: string) => Promise<ChatUnreadUpdate | null>;
//# sourceMappingURL=chatReadStateService.d.ts.map