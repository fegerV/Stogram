export interface N8nEvent {
    type: string;
    data: any;
    timestamp: string;
}
export declare const N8N_EVENTS: {
    NEW_MESSAGE: string;
    NEW_CHAT: string;
    USER_REGISTERED: string;
    CALL_STARTED: string;
    CALL_ENDED: string;
    MESSAGE_UPDATED: string;
    MESSAGE_DELETED: string;
    CHAT_UPDATED: string;
    USER_STATUS_CHANGED: string;
    REACTION_ADDED: string;
    MEMBER_JOINED: string;
    MEMBER_LEFT: string;
};
declare class N8nService {
    private resolveSecretValue;
    private getConfig;
    private getActiveWebhooks;
    deliverWebhookEvent(eventType: string, data: any): Promise<void>;
    private sendWebhook;
    private logDelivery;
    getConfigSettings(): Promise<{
        webhookUrl: string | null | undefined;
        apiKey: string | null;
        hasApiKey: boolean;
        enabled: boolean;
    }>;
    saveConfigSettings(data: {
        webhookUrl?: string;
        apiKey?: string;
        enabled?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        webhookUrl: string | null;
        enabled: boolean;
        apiKey: string | null;
    }>;
    getWebhooks(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        webhookUrl: string;
        events: string;
        enabled: boolean;
        secret: string | null;
    }[]>;
    getWebhookById(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        webhookUrl: string;
        events: string;
        enabled: boolean;
        secret: string | null;
    } | null>;
    createWebhook(data: {
        name: string;
        webhookUrl: string;
        events: string[];
        secret?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        webhookUrl: string;
        events: string;
        enabled: boolean;
        secret: string | null;
    }>;
    updateWebhook(id: string, data: {
        name?: string;
        webhookUrl?: string;
        events?: string[];
        secret?: string;
        enabled?: boolean;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        webhookUrl: string;
        events: string;
        enabled: boolean;
        secret: string | null;
    }>;
    deleteWebhook(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        webhookUrl: string;
        events: string;
        enabled: boolean;
        secret: string | null;
    }>;
    getWebhookLogs(webhookId: string, limit?: number): Promise<{
        id: string;
        status: number;
        webhookId: string;
        event: string;
        payload: string;
        response: string | null;
        attempts: number;
        deliveredAt: Date;
    }[]>;
    testWebhook(webhookUrl: string, options?: {
        secret?: string;
        apiKey?: string;
    }): Promise<boolean>;
    triggerWorkflow(workflowId: string, data?: any): Promise<boolean>;
    getWorkflows(): Promise<{
        id: string;
        name: string;
        active: boolean;
    }[]>;
    sendToN8n(event: N8nEvent): Promise<boolean>;
}
declare const _default: N8nService;
export default _default;
//# sourceMappingURL=n8nService.d.ts.map