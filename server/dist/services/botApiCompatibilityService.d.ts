import { Prisma } from '@prisma/client';
type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonObject | JsonValue[];
type JsonObject = {
    [key: string]: JsonValue;
};
interface BotMethodResponse<T extends JsonValue | JsonObject | JsonValue[]> {
    ok: boolean;
    result: T;
}
interface PendingUpdate {
    update_id: number;
    [key: string]: JsonValue;
}
declare class BotApiCompatibilityService {
    private markUpdateConsumed;
    private parseAllowedUpdates;
    private isUpdateAllowed;
    private buildUser;
    private buildChat;
    private buildBotMessageMeta;
    private buildMessagePayload;
    private findBotByToken;
    private getNextUpdateId;
    private persistUpdate;
    private deliverWebhook;
    private getHydratedMessage;
    private sendBotAppMessage;
    getBot(token: string): Promise<({
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
        apiAllowedUpdates: Prisma.JsonValue | null;
        menuButton: Prisma.JsonValue | null;
        lastUpdateId: number;
        messagesSent: number;
        messagesReceived: number;
        uniqueUsers: number;
    }) | null>;
    getMe(token: string): Promise<BotMethodResponse<JsonObject>>;
    setWebhook(token: string, url: string, secretToken?: string, allowedUpdates?: string[]): Promise<BotMethodResponse<true>>;
    deleteWebhook(token: string, dropPendingUpdates?: boolean): Promise<BotMethodResponse<true>>;
    getWebhookInfo(token: string): Promise<BotMethodResponse<JsonObject>>;
    getUpdates(token: string, options?: {
        offset?: number;
        limit?: number;
    }): Promise<BotMethodResponse<PendingUpdate[]>>;
    setMyCommands(token: string, commands: Array<{
        command: string;
        description: string;
    }>): Promise<BotMethodResponse<true>>;
    getMyCommands(token: string): Promise<BotMethodResponse<JsonObject[]>>;
    sendMessage(token: string, payload: {
        chat_id: string;
        text: string;
        reply_markup?: {
            inline_keyboard?: JsonValue[][];
        };
    }): Promise<BotMethodResponse<JsonObject>>;
    sendMedia(token: string, payload: {
        chat_id: string;
        mediaUrl: string;
        caption?: string;
        fileName?: string;
        type: 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
    }): Promise<BotMethodResponse<JsonObject>>;
    editMessageText(token: string, payload: {
        chat_id: string;
        message_id: string;
        text: string;
        reply_markup?: {
            inline_keyboard?: JsonValue[][];
        };
    }): Promise<BotMethodResponse<JsonObject>>;
    deleteMessage(token: string, payload: {
        chat_id: string;
        message_id: string;
    }): Promise<BotMethodResponse<true>>;
    answerCallbackQuery(token: string, callbackQueryId: string, text?: string): Promise<BotMethodResponse<true>>;
    answerInlineQuery(token: string, inlineQueryId: string, results: JsonValue[]): Promise<BotMethodResponse<true>>;
    setChatMenuButton(token: string, menuButton: JsonObject): Promise<BotMethodResponse<true>>;
    getChatMenuButton(token: string): Promise<BotMethodResponse<JsonObject>>;
    publishMessageUpdate(botId: string, messageId: string, updateField: 'message' | 'edited_message'): Promise<void>;
    publishCallbackQueryUpdate(botId: string, queryId: string): Promise<void>;
    publishInlineQueryUpdate(botId: string, inlineQueryId: string): Promise<void>;
}
declare const _default: BotApiCompatibilityService;
export default _default;
//# sourceMappingURL=botApiCompatibilityService.d.ts.map