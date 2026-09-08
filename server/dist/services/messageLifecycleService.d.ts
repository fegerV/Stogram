import { MessageType } from '@prisma/client';
import { ChatUnreadUpdate } from './chatReadStateService';
export interface SendChatMessageInput {
    chatId: string;
    senderId: string;
    content?: string;
    type?: MessageType | 'GIF' | 'VOICE';
    replyToId?: string;
    scheduledFor?: string;
    expiresIn?: number;
    isSilent?: boolean;
    clientMessageId?: string;
    file?: Express.Multer.File;
}
export interface SendChatMessageResult {
    message: any;
    isDuplicate: boolean;
    links: string[];
    unreadUpdates: ChatUnreadUpdate[];
}
export declare const sendChatMessage: (input: SendChatMessageInput) => Promise<SendChatMessageResult>;
export declare const attachLinkPreview: (messageId: string, chatId: string, url: string, onUpdated: (message: any) => void) => Promise<void>;
//# sourceMappingURL=messageLifecycleService.d.ts.map