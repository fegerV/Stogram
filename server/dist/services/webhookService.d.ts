export declare const deliverWebhook: (webhook: {
    id: string;
    url: string;
    secret?: string | null;
}, event: string, payload: unknown) => Promise<{
    delivery: {
        id: string;
        status: number;
        webhookId: string;
        event: string;
        payload: string;
        response: string | null;
        attempts: number;
        deliveredAt: Date;
    };
    success: boolean;
}>;
export declare const deliverToBotWebhooks: (botId: string, event: string, payload: unknown) => Promise<PromiseSettledResult<{
    delivery: {
        id: string;
        status: number;
        webhookId: string;
        event: string;
        payload: string;
        response: string | null;
        attempts: number;
        deliveredAt: Date;
    };
    success: boolean;
}>[]>;
export declare const retryWebhookDelivery: (deliveryId: string) => Promise<{
    delivery: {
        id: string;
        status: number;
        webhookId: string;
        event: string;
        payload: string;
        response: string | null;
        attempts: number;
        deliveredAt: Date;
    };
    success: boolean;
}>;
//# sourceMappingURL=webhookService.d.ts.map