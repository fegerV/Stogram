import { Request, Response } from 'express';
export declare const telegramController: {
    webhook: (req: Request, res: Response) => Promise<void>;
    authTelegram: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    linkAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    unlinkAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createBridge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteBridge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    toggleBridge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    miniAppAuth: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    sendTestNotification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=telegramController.d.ts.map