import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getStickerPacks: (req: Request, res: Response) => Promise<void>;
export declare const getStickerPack: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createStickerPack: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addStickerToPack: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteSticker: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteStickerPack: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=stickerController.d.ts.map