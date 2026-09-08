"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8N_EVENTS = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// Supported webhook events
exports.N8N_EVENTS = {
    NEW_MESSAGE: 'new_message',
    NEW_CHAT: 'new_chat',
    USER_REGISTERED: 'user_registered',
    CALL_STARTED: 'call_started',
    CALL_ENDED: 'call_ended',
    MESSAGE_UPDATED: 'message_updated',
    MESSAGE_DELETED: 'message_deleted',
    CHAT_UPDATED: 'chat_updated',
    USER_STATUS_CHANGED: 'user_status_changed',
    REACTION_ADDED: 'reaction_added',
    MEMBER_JOINED: 'member_joined',
    MEMBER_LEFT: 'member_left',
};
class N8nService {
    resolveSecretValue(incomingValue, existingValue) {
        if (typeof incomingValue !== 'string') {
            return existingValue ?? undefined;
        }
        const trimmedValue = incomingValue.trim();
        if (!trimmedValue) {
            return existingValue ?? undefined;
        }
        if (existingValue && trimmedValue === `***${existingValue.slice(-4)}`) {
            return existingValue;
        }
        return trimmedValue;
    }
    getConfig() {
        return prisma_1.default.n8nConfig.findFirst();
    }
    async getActiveWebhooks() {
        return await prisma_1.default.n8nWebhook.findMany({
            where: { enabled: true }
        });
    }
    // Deliver webhook event to all matching webhooks
    async deliverWebhookEvent(eventType, data) {
        const webhooks = await this.getActiveWebhooks();
        const timestamp = new Date().toISOString();
        const event = {
            type: eventType,
            data,
            timestamp,
        };
        // Get all enabled webhooks and filter by event
        for (const webhook of webhooks) {
            const events = JSON.parse(webhook.events || '[]');
            // If webhook is subscribed to this event type
            if (events.includes(eventType) || events.includes('*')) {
                await this.sendWebhook(webhook, event);
            }
        }
    }
    // Send webhook to a specific URL
    async sendWebhook(webhook, event) {
        const maxAttempts = 3;
        let attempts = 0;
        let lastError = null;
        while (attempts < maxAttempts) {
            attempts++;
            try {
                const payload = JSON.stringify(event);
                const headers = {
                    'Content-Type': 'application/json',
                };
                // Add HMAC signature if secret is configured
                if (webhook.secret) {
                    const signature = crypto_1.default
                        .createHmac('sha256', webhook.secret)
                        .update(payload)
                        .digest('hex');
                    headers['X-Webhook-Signature'] = signature;
                }
                await axios_1.default.post(webhook.webhookUrl, event, {
                    headers,
                    timeout: 30000,
                });
                // Log successful delivery
                await this.logDelivery(webhook.id, event.type, payload, 200, 'OK');
                return;
            }
            catch (error) {
                lastError = error;
                console.error(`Webhook delivery attempt ${attempts} failed:`, error.message);
                // Log failed delivery
                await this.logDelivery(webhook.id, event.type, JSON.stringify(event), error.response?.status || 500, error.message);
            }
        }
        console.error(`All webhook delivery attempts failed for event ${event.type}:`, lastError?.message);
    }
    // Log webhook delivery
    async logDelivery(webhookId, event, payload, status, response) {
        try {
            await prisma_1.default.n8nWebhookLog.create({
                data: {
                    webhookId,
                    event,
                    payload,
                    status,
                    response,
                },
            });
        }
        catch (error) {
            console.error('Failed to log webhook delivery:', error);
        }
    }
    // Get n8n configuration
    async getConfigSettings() {
        const config = await prisma_1.default.n8nConfig.findFirst();
        return {
            webhookUrl: config?.webhookUrl,
            apiKey: config?.apiKey ? '***' + config.apiKey.slice(-4) : null,
            hasApiKey: Boolean(config?.apiKey),
            enabled: config?.enabled || false,
        };
    }
    // Save n8n configuration
    async saveConfigSettings(data) {
        const existingConfig = await prisma_1.default.n8nConfig.findFirst();
        const resolvedApiKey = this.resolveSecretValue(data.apiKey, existingConfig?.apiKey);
        if (existingConfig) {
            return await prisma_1.default.n8nConfig.update({
                where: { id: existingConfig.id },
                data: {
                    webhookUrl: data.webhookUrl ?? existingConfig.webhookUrl,
                    apiKey: resolvedApiKey ?? existingConfig.apiKey,
                    enabled: data.enabled ?? existingConfig.enabled,
                },
            });
        }
        else {
            return await prisma_1.default.n8nConfig.create({
                data: {
                    webhookUrl: data.webhookUrl || '',
                    apiKey: resolvedApiKey || '',
                    enabled: data.enabled || false,
                },
            });
        }
    }
    // Get all webhooks
    async getWebhooks() {
        return await prisma_1.default.n8nWebhook.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    // Get webhook by ID
    async getWebhookById(id) {
        return await prisma_1.default.n8nWebhook.findUnique({
            where: { id },
        });
    }
    // Create webhook
    async createWebhook(data) {
        return await prisma_1.default.n8nWebhook.create({
            data: {
                name: data.name,
                webhookUrl: data.webhookUrl,
                events: JSON.stringify(data.events),
                secret: data.secret,
                enabled: true,
            },
        });
    }
    // Update webhook
    async updateWebhook(id, data) {
        const webhook = await prisma_1.default.n8nWebhook.findUnique({ where: { id } });
        if (!webhook)
            throw new Error('Webhook not found');
        return await prisma_1.default.n8nWebhook.update({
            where: { id },
            data: {
                name: data.name ?? webhook.name,
                webhookUrl: data.webhookUrl ?? webhook.webhookUrl,
                events: data.events ? JSON.stringify(data.events) : webhook.events,
                secret: data.secret ?? webhook.secret,
                enabled: data.enabled ?? webhook.enabled,
            },
        });
    }
    // Delete webhook
    async deleteWebhook(id) {
        return await prisma_1.default.n8nWebhook.delete({
            where: { id },
        });
    }
    // Get webhook logs
    async getWebhookLogs(webhookId, limit = 50) {
        return await prisma_1.default.n8nWebhookLog.findMany({
            where: { webhookId },
            orderBy: { deliveredAt: 'desc' },
            take: limit,
        });
    }
    // Test webhook
    async testWebhook(webhookUrl, options) {
        const testEvent = {
            type: 'test',
            data: {
                message: 'This is a test webhook from Stogram',
                timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
        };
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (options?.apiKey) {
                headers['Authorization'] = `Bearer ${options.apiKey}`;
            }
            if (options?.secret) {
                const payload = JSON.stringify(testEvent);
                const signature = crypto_1.default
                    .createHmac('sha256', options.secret)
                    .update(payload)
                    .digest('hex');
                headers['X-Webhook-Signature'] = signature;
            }
            await axios_1.default.post(webhookUrl, testEvent, {
                headers,
                timeout: 10000,
            });
            return true;
        }
        catch (error) {
            console.error('Webhook test failed:', error);
            return false;
        }
    }
    // Trigger a specific workflow (for n8n workflow triggering)
    async triggerWorkflow(workflowId, data) {
        const config = await this.getConfig();
        if (!config?.webhookUrl || !config?.apiKey) {
            throw new Error('n8n is not configured');
        }
        try {
            await axios_1.default.post(`${config.webhookUrl}/webhook/${workflowId}`, data || {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
            });
            return true;
        }
        catch (error) {
            console.error('Failed to trigger workflow:', error);
            return false;
        }
    }
    // Get active workflows from n8n API
    async getWorkflows() {
        const config = await this.getConfig();
        if (!config?.webhookUrl || !config?.apiKey) {
            // Return empty array if n8n is not configured instead of fake data
            return [];
        }
        try {
            // Extract base URL from webhook URL (e.g., https://n8n.example.com/webhook/... -> https://n8n.example.com)
            const baseUrl = config.webhookUrl.split('/webhook')[0];
            const response = await axios_1.default.get(`${baseUrl}/api/v1/workflows`, {
                headers: {
                    'X-N8N-API-KEY': config.apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            // n8n API returns workflows in data.data or directly in data depending on version
            const workflowsData = response.data?.data || response.data || [];
            return Array.isArray(workflowsData)
                ? workflowsData.map((wf) => ({
                    id: String(wf.id),
                    name: wf.name || 'Unnamed Workflow',
                    active: Boolean(wf.active),
                }))
                : [];
        }
        catch (error) {
            console.error('Failed to fetch workflows from n8n API:', error.message);
            throw new Error(`Failed to fetch workflows: ${error.message}`);
        }
    }
    // Send event directly to configured n8n webhook
    async sendToN8n(event) {
        const config = await this.getConfig();
        if (!config?.enabled || !config?.webhookUrl) {
            return false;
        }
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (config.apiKey) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }
            await axios_1.default.post(config.webhookUrl, event, {
                headers,
                timeout: 30000,
            });
            return true;
        }
        catch (error) {
            console.error('Failed to send to n8n:', error);
            return false;
        }
    }
}
exports.default = new N8nService();
//# sourceMappingURL=n8nService.js.map