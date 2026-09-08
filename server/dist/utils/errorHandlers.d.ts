import { Response } from 'express';
export declare const handleControllerError: (error: unknown, res: Response, message?: string) => Response<any, Record<string, any>> | undefined;
export declare const handleNotFound: (res: Response, resource?: string) => Response<any, Record<string, any>>;
export declare const handleUnauthorized: (res: Response, message?: string) => Response<any, Record<string, any>>;
export declare const handleForbidden: (res: Response, message?: string) => Response<any, Record<string, any>>;
export declare const handleBadRequest: (res: Response, message: string) => Response<any, Record<string, any>>;
//# sourceMappingURL=errorHandlers.d.ts.map