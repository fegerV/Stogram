import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getN8nConfig: (req: Request, res: Response) => Promise<void>;
export declare const saveN8nConfig: (req: Request, res: Response) => Promise<void>;
export declare const getWebhooks: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createWebhook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateWebhook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteWebhook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const testWebhook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getWebhookLogs: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getWorkflows: (req: Request, res: Response) => Promise<void>;
export declare const triggerWorkflow: (req: Request, res: Response) => Promise<void>;
export declare const n8nWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=n8nSettingsController.d.ts.map