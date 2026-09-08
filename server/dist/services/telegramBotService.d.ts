import TelegramBot from 'node-telegram-bot-api';
import { TelegramBotCommandConfig } from './telegramBotTexts';
interface BotCommandConfig extends TelegramBotCommandConfig {
    command: string;
    description: string;
}
declare class TelegramBotService {
    private bot;
    private config;
    private commands;
    initialize(): Promise<void>;
    private loadConfig;
    private getCommandConfigs;
    private getDefaultCommands;
    private getWebhookSecretToken;
    private initializeBot;
    private setupCommands;
    private setupHandlers;
    private getAuthorizedBotUser;
    private handleStart;
    private handleHelp;
    private handleStatus;
    private handleChats;
    private handleUnread;
    private handleSearch;
    private handleNotify;
    private handleConnect;
    private handleDisconnect;
    private handleInlineQuery;
    private handleCallbackQuery;
    private handleMessage;
    getConfig(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        webhookUrl: string | null;
        enabled: boolean;
        commands: string;
        botToken: string;
        botUsername: string | null;
        notifications: boolean;
    } | null>;
    saveConfig(data: {
        botToken?: string;
        botUsername?: string;
        webhookUrl?: string;
        commands?: BotCommandConfig[];
        notifications?: boolean;
        enabled?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        webhookUrl: string | null;
        enabled: boolean;
        commands: string;
        botToken: string;
        botUsername: string | null;
        notifications: boolean;
    }>;
    getStats(): Promise<{
        authorizedUsers: number;
        totalMessages: number;
        enabled: boolean;
        botUsername: string;
    }>;
    getUsers(): Promise<{
        id: string;
        username: string | null;
        telegramId: string;
        createdAt: Date;
        updatedAt: Date;
        stogramUserId: string | null;
        firstName: string | null;
        lastName: string | null;
        isAuthorized: boolean;
    }[]>;
    authorizeUser(telegramId: string, stogramUserId: string): Promise<{
        id: string;
        username: string | null;
        telegramId: string;
        createdAt: Date;
        updatedAt: Date;
        stogramUserId: string | null;
        firstName: string | null;
        lastName: string | null;
        isAuthorized: boolean;
    }>;
    sendMessage(telegramUserId: string, content: string, options?: TelegramBot.SendMessageOptions): Promise<boolean>;
    sendNotificationToUser(stogramUserId: string, message: string): Promise<boolean>;
    broadcastNotification(message: string): Promise<number>;
    isWebhookRequestAuthorized(secretTokenHeader: string | string[] | undefined): boolean;
    processWebhookUpdate(update: TelegramBot.Update): void;
}
declare const _default: TelegramBotService;
export default _default;
//# sourceMappingURL=telegramBotService.d.ts.map