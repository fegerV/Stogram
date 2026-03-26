import axios from 'axios';
import crypto from 'crypto';
import prisma from '../utils/prisma';

export interface N8nEvent {
  type: string;
  data: any;
  timestamp: string;
}

// Supported webhook events
export const N8N_EVENTS = {
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
  private resolveSecretValue(incomingValue: string | undefined, existingValue?: string | null) {
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

  private getConfig() {
    return prisma.n8nConfig.findFirst();
  }

  private async getActiveWebhooks(): Promise<any[]> {
    return await prisma.n8nWebhook.findMany({
      where: { enabled: true }
    });
  }

  // Deliver webhook event to all matching webhooks
  async deliverWebhookEvent(eventType: string, data: any): Promise<void> {
    const webhooks = await this.getActiveWebhooks();
    const timestamp = new Date().toISOString();

    const event: N8nEvent = {
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
  private async sendWebhook(webhook: any, event: N8nEvent): Promise<void> {
    const maxAttempts = 3;
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const payload = JSON.stringify(event);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add HMAC signature if secret is configured
        if (webhook.secret) {
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(payload)
            .digest('hex');
          headers['X-Webhook-Signature'] = signature;
        }

        await axios.post(webhook.webhookUrl, event, {
          headers,
          timeout: 30000,
        });

        // Log successful delivery
        await this.logDelivery(webhook.id, event.type, payload, 200, 'OK');
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`Webhook delivery attempt ${attempts} failed:`, error.message);
        
        // Log failed delivery
        await this.logDelivery(
          webhook.id,
          event.type,
          JSON.stringify(event),
          error.response?.status || 500,
          error.message
        );
      }
    }

    console.error(`All webhook delivery attempts failed for event ${event.type}:`, lastError?.message);
  }

  // Log webhook delivery
  private async logDelivery(
    webhookId: string,
    event: string,
    payload: string,
    status: number,
    response: string
  ): Promise<void> {
    try {
      await prisma.n8nWebhookLog.create({
        data: {
          webhookId,
          event,
          payload,
          status,
          response,
        },
      });
    } catch (error) {
      console.error('Failed to log webhook delivery:', error);
    }
  }

  // Get n8n configuration
  async getConfigSettings() {
    const config = await prisma.n8nConfig.findFirst();
    return {
      webhookUrl: config?.webhookUrl,
      apiKey: config?.apiKey ? '***' + config.apiKey.slice(-4) : null,
      hasApiKey: Boolean(config?.apiKey),
      enabled: config?.enabled || false,
    };
  }

  // Save n8n configuration
  async saveConfigSettings(data: { webhookUrl?: string; apiKey?: string; enabled?: boolean }) {
    const existingConfig = await prisma.n8nConfig.findFirst();
    const resolvedApiKey = this.resolveSecretValue(data.apiKey, existingConfig?.apiKey);

    if (existingConfig) {
      return await prisma.n8nConfig.update({
        where: { id: existingConfig.id },
        data: {
          webhookUrl: data.webhookUrl ?? existingConfig.webhookUrl,
          apiKey: resolvedApiKey ?? existingConfig.apiKey,
          enabled: data.enabled ?? existingConfig.enabled,
        },
      });
    } else {
      return await prisma.n8nConfig.create({
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
    return await prisma.n8nWebhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get webhook by ID
  async getWebhookById(id: string) {
    return await prisma.n8nWebhook.findUnique({
      where: { id },
    });
  }

  // Create webhook
  async createWebhook(data: {
    name: string;
    webhookUrl: string;
    events: string[];
    secret?: string;
  }) {
    return await prisma.n8nWebhook.create({
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
  async updateWebhook(
    id: string,
    data: {
      name?: string;
      webhookUrl?: string;
      events?: string[];
      secret?: string;
      enabled?: boolean;
    }
  ) {
    const webhook = await prisma.n8nWebhook.findUnique({ where: { id } });
    if (!webhook) throw new Error('Webhook not found');

    return await prisma.n8nWebhook.update({
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
  async deleteWebhook(id: string) {
    return await prisma.n8nWebhook.delete({
      where: { id },
    });
  }

  // Get webhook logs
  async getWebhookLogs(webhookId: string, limit = 50) {
    return await prisma.n8nWebhookLog.findMany({
      where: { webhookId },
      orderBy: { deliveredAt: 'desc' },
      take: limit,
    });
  }

  // Test webhook
  async testWebhook(
    webhookUrl: string,
    options?: { secret?: string; apiKey?: string }
  ): Promise<boolean> {
    const testEvent: N8nEvent = {
      type: 'test',
      data: {
        message: 'This is a test webhook from Stogram',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (options?.apiKey) {
        headers['Authorization'] = `Bearer ${options.apiKey}`;
      }

      if (options?.secret) {
        const payload = JSON.stringify(testEvent);
        const signature = crypto
          .createHmac('sha256', options.secret)
          .update(payload)
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }

      await axios.post(webhookUrl, testEvent, {
        headers,
        timeout: 10000,
      });

      return true;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }

  // Trigger a specific workflow (for n8n workflow triggering)
  async triggerWorkflow(workflowId: string, data?: any): Promise<boolean> {
    const config = await this.getConfig();
    if (!config?.webhookUrl || !config?.apiKey) {
      throw new Error('n8n is not configured');
    }

    try {
      await axios.post(
        `${config.webhookUrl}/webhook/${workflowId}`,
        data || {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
        }
      );
      return true;
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
      return false;
    }
  }

  // Get active workflows (mock implementation - would require n8n API integration)
  async getWorkflows(): Promise<{ id: string; name: string; active: boolean }[]> {
    // This would need actual n8n API integration
    // For now, return sample data
    return [
      { id: '1', name: 'New User Welcome', active: true },
      { id: '2', name: 'Message Notifications', active: true },
      { id: '3', name: 'Analytics Sync', active: false },
    ];
  }

  // Send event directly to configured n8n webhook
  async sendToN8n(event: N8nEvent): Promise<boolean> {
    const config = await this.getConfig();
    if (!config?.enabled || !config?.webhookUrl) {
      return false;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      await axios.post(config.webhookUrl, event, {
        headers,
        timeout: 30000,
      });

      return true;
    } catch (error) {
      console.error('Failed to send to n8n:', error);
      return false;
    }
  }
}

export default new N8nService();
