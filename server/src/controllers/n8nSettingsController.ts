import { Request, Response } from 'express';
import n8nService from '../services/n8nService';
import prisma from '../utils/prisma';

// Get n8n configuration
export const getN8nConfig = async (req: Request, res: Response) => {
  try {
    const config = await n8nService.getConfigSettings();
    res.json(config);
  } catch (error) {
    console.error('Error getting n8n config:', error);
    res.status(500).json({ error: 'Failed to get n8n configuration' });
  }
};

// Save n8n configuration
export const saveN8nConfig = async (req: Request, res: Response) => {
  try {
    const { webhookUrl, apiKey, enabled } = req.body;
    const config = await n8nService.saveConfigSettings({ webhookUrl, apiKey, enabled });
    res.json(config);
  } catch (error) {
    console.error('Error saving n8n config:', error);
    res.status(500).json({ error: 'Failed to save n8n configuration' });
  }
};

// Get all webhooks
export const getWebhooks = async (req: Request, res: Response) => {
  try {
    const webhooks = await n8nService.getWebhooks();
    res.json({ webhooks });
  } catch (error) {
    console.error('Error getting webhooks:', error);
    res.status(500).json({ error: 'Failed to get webhooks' });
  }
};

// Create webhook
export const createWebhook = async (req: Request, res: Response) => {
  try {
    const { name, webhookUrl, events, secret } = req.body;

    if (!name || !webhookUrl || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Name, webhookUrl, and events array are required' });
    }

    const webhook = await n8nService.createWebhook({ name, webhookUrl, events, secret });
    res.status(201).json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
};

// Update webhook
export const updateWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, webhookUrl, events, secret, enabled } = req.body;

    const webhook = await n8nService.updateWebhook(id, { name, webhookUrl, events, secret, enabled });
    res.json(webhook);
  } catch (error: any) {
    console.error('Error updating webhook:', error);
    if (error.message === 'Webhook not found') {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.status(500).json({ error: 'Failed to update webhook' });
  }
};

// Delete webhook
export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await n8nService.deleteWebhook(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
};

// Test webhook
export const testWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookUrl, secret, apiKey } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL is required' });
    }

    const savedConfig = await prisma.n8nConfig.findFirst();
    const success = await n8nService.testWebhook(webhookUrl, {
      secret,
      apiKey: typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : savedConfig?.apiKey || undefined,
    });
    
    if (success) {
      res.json({ success: true, message: 'Test webhook sent successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Failed to send test webhook' });
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
};

// Get webhook logs
export const getWebhookLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const logs = await n8nService.getWebhookLogs(id, limit ? parseInt(limit as string) : 50);
    res.json({ logs });
  } catch (error) {
    console.error('Error getting webhook logs:', error);
    res.status(500).json({ error: 'Failed to get webhook logs' });
  }
};

// Get workflows
export const getWorkflows = async (req: Request, res: Response) => {
  try {
    const workflows = await n8nService.getWorkflows();
    res.json({ workflows });
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({ error: 'Failed to get workflows' });
  }
};

// Trigger workflow
export const triggerWorkflow = async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { data } = req.body;

    const success = await n8nService.triggerWorkflow(workflowId, data);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Failed to trigger workflow' });
    }
  } catch (error) {
    console.error('Error triggering workflow:', error);
    res.status(500).json({ error: 'Failed to trigger workflow' });
  }
};

// Main webhook endpoint (for receiving from n8n)
export const n8nWebhook = async (req: Request, res: Response) => {
  try {
    // Handle incoming webhook from n8n
    const { action, data } = req.body;
    const savedConfig = await prisma.n8nConfig.findFirst();
    const expectedApiKey = savedConfig?.apiKey?.trim();

    if (expectedApiKey) {
      const authorizationHeader = req.headers.authorization;
      const bearerToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.slice('Bearer '.length).trim()
        : undefined;
      const headerApiKey = typeof req.headers['x-n8n-api-key'] === 'string'
        ? req.headers['x-n8n-api-key'].trim()
        : undefined;

      if (bearerToken !== expectedApiKey && headerApiKey !== expectedApiKey) {
        return res.status(403).json({ error: 'Invalid n8n webhook credentials' });
      }
    }
    
    console.log('Received n8n webhook:', action, data);
    
    // Process the webhook based on action
    switch (action) {
      case 'ping':
        res.json({ status: 'ok', message: 'pong' });
        break;
      case 'create_chat':
        if (!data?.userId || !Array.isArray(data.memberIds) || !data.type) {
          return res.status(400).json({
            error: 'create_chat requires data.userId, data.type and data.memberIds[]',
          });
        }

        if (!['PRIVATE', 'GROUP', 'CHANNEL'].includes(data.type)) {
          return res.status(400).json({ error: 'Unsupported chat type' });
        }

        if (data.type === 'GROUP' && !data.name) {
          return res.status(400).json({ error: 'Group chats require a name' });
        }

        {
          const distinctMemberIds = Array.from(
            new Set(
              (data.memberIds as string[])
                .map((memberId) => String(memberId).trim())
                .filter(Boolean)
                .filter((memberId) => memberId !== data.userId)
            )
          );

          const chat = await prisma.chat.create({
            data: {
              name: data.name || null,
              type: data.type,
              description: data.description || null,
              members: {
                create: [
                  { userId: data.userId, role: 'OWNER' },
                  ...distinctMemberIds.map((memberId) => ({ userId: memberId, role: 'MEMBER' as const })),
                ],
              },
            },
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          });

          return res.status(201).json({ status: 'processed', action: 'create_chat', chat });
        }
        break;
      case 'send_message':
        if (!data?.userId || !data?.chatId || !data?.content) {
          return res.status(400).json({
            error: 'send_message requires data.userId, data.chatId and data.content',
          });
        }

        {
          const membership = await prisma.chatMember.findFirst({
            where: {
              chatId: data.chatId,
              userId: data.userId,
            },
          });

          if (!membership) {
            return res.status(403).json({ error: 'User is not a member of the target chat' });
          }

          const message = await prisma.message.create({
            data: {
              chatId: data.chatId,
              senderId: data.userId,
              content: data.content,
              type: data.type || 'TEXT',
              isSent: true,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
          });

          return res.status(201).json({ status: 'processed', action: 'send_message', message });
        }
        break;
      default:
        res.json({ status: 'received', action });
    }
  } catch (error) {
    console.error('Error processing n8n webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};
