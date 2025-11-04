import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        username: string;
        displayName?: string | null;
        avatar?: string | null;
        bio?: string | null;
        status?: string;
      };
    }
  }
}
