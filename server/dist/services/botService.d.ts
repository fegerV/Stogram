export interface BotMessageOptions {
    chatId: string;
    content?: string;
    type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'VOICE' | 'GIF';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    thumbnailUrl?: string;
    linkPreview?: unknown;
}
export declare const generateBotToken: () => string;
export declare const getBotByToken: (token: string) => Promise<({
    commands: {
        id: string;
        createdAt: Date;
        botId: string;
        description: string;
        command: string;
    }[];
} & {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    webhookUrl: string | null;
    description: string | null;
    token: string;
    isInline: boolean;
    ownerId: string;
    apiWebhookSecret: string | null;
    apiAllowedUpdates: import("@prisma/client/runtime/library").JsonValue | null;
    menuButton: import("@prisma/client/runtime/library").JsonValue | null;
    lastUpdateId: number;
    messagesSent: number;
    messagesReceived: number;
    uniqueUsers: number;
}) | null>;
/**
 * Send a message on behalf of a bot.
 * This creates a bot-sent message that appears in the chat.
 * The message is associated with the bot owner's user account but can be tracked as a bot message.
 */
export declare const sendBotMessage: (bot: {
    id: string;
    ownerId: string;
    isActive: boolean;
}, options: BotMessageOptions) => Promise<{
    bot: {
        id: string;
        username: string;
        displayName: string;
        avatar: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        webhookUrl: string | null;
        description: string | null;
        token: string;
        isInline: boolean;
        ownerId: string;
        apiWebhookSecret: string | null;
        apiAllowedUpdates: import("@prisma/client/runtime/library").JsonValue | null;
        menuButton: import("@prisma/client/runtime/library").JsonValue | null;
        lastUpdateId: number;
        messagesSent: number;
        messagesReceived: number;
        uniqueUsers: number;
    } | null;
    sender: {
        id: string;
        username: string;
        displayName: string | null;
        avatar: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    chatId: string;
    type: import(".prisma/client").$Enums.MessageType;
    expiresAt: Date | null;
    clientMessageId: string | null;
    content: string | null;
    senderId: string;
    botId: string | null;
    replyToId: string | null;
    forwardedFromId: string | null;
    forwardedFromChatId: string | null;
    forwardedFromUserId: string | null;
    isForwarded: boolean;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    thumbnailUrl: string | null;
    duration: number | null;
    waveform: string | null;
    stickerId: string | null;
    isEdited: boolean;
    isDeleted: boolean;
    isSilent: boolean;
    scheduledFor: Date | null;
    isSent: boolean;
    mentions: string | null;
    hashtags: string | null;
    linkPreview: import("@prisma/client/runtime/library").JsonValue | null;
    isEncrypted: boolean;
    encryptedContent: string | null;
    encryptionKeyId: string | null;
    isCompressed: boolean;
    originalFileUrl: string | null;
    videoFormats: string | null;
}>;
/**
 * Validate bot permissions for a specific chat
 */
export declare const validateBotChatAccess: (botOwnerId: string, chatId: string) => Promise<boolean>;
export declare const installBotInChat: (botId: string, userId: string, chatId: string) => Promise<{
    chat: {
        name: string | null;
        id: string;
        avatar: string | null;
        type: import(".prisma/client").$Enums.ChatType;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    chatId: string;
    botId: string;
    isActive: boolean;
    installedBy: string;
}>;
export declare const uninstallBotFromChat: (botId: string, userId: string, chatId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    chatId: string;
    botId: string;
    isActive: boolean;
    installedBy: string;
}>;
export declare const getBotInstallations: (botId: string, userId: string) => Promise<({
    chat: {
        name: string | null;
        id: string;
        avatar: string | null;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    chatId: string;
    botId: string;
    isActive: boolean;
    installedBy: string;
})[]>;
//# sourceMappingURL=botService.d.ts.map