export interface TelegramBotCommandConfig {
    command: string;
    description: string;
}
export declare const DEFAULT_TELEGRAM_BOT_COMMANDS: TelegramBotCommandConfig[];
export declare const buildStartConnectedText: (firstName?: string) => string;
export declare const buildStartDisconnectedText: (firstName?: string) => string;
export declare const buildHelpText: (botUsername?: string | null) => string;
export declare const buildNotifyUsageText: () => string;
export declare const buildConnectUsageText: () => string;
//# sourceMappingURL=telegramBotTexts.d.ts.map