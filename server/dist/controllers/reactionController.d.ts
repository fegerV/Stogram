import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Add reaction to a message
 */
export declare const addReaction: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Remove reaction from a message
 */
export declare const removeReaction: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get reactions for a message
 */
export declare const getReactions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=reactionController.d.ts.map