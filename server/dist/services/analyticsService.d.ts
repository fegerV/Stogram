export declare class AnalyticsService {
    static trackUserActivity(userId: string, activityType: string): Promise<void>;
    static trackBotActivity(botId: string, activityType: 'message_sent' | 'message_received', userId?: string): Promise<void>;
    static trackBotCommand(botId: string, command: string): Promise<void>;
    static updateSystemAnalytics(): Promise<void>;
    static getUserAnalytics(userId: string, days?: number): Promise<{
        id: string;
        userId: string;
        messagesSent: number;
        messagesReceived: number;
        date: Date;
        callsMade: number;
        callsReceived: number;
        activeMinutes: number;
    }[]>;
    static getBotAnalytics(botId: string, days?: number): Promise<{
        id: string;
        botId: string;
        messagesSent: number;
        messagesReceived: number;
        uniqueUsers: number;
        commands: string | null;
        date: Date;
    }[]>;
    static getSystemAnalytics(days?: number): Promise<{
        id: string;
        date: Date;
        totalUsers: number;
        activeUsers: number;
        totalMessages: number;
        totalCalls: number;
        totalStorage: bigint;
        avgResponseTime: number;
        errorCount: number;
    }[]>;
    static getDashboardStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        todayMessages: number;
        todayCalls: number;
        activeBots: number;
    }>;
    static trackActiveMinutes(userId: string, minutes: number): Promise<void>;
}
//# sourceMappingURL=analyticsService.d.ts.map