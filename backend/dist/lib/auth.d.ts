import { Request, Response, NextFunction } from 'express';
export interface AuthUser {
    userId: string;
    email: string;
    role: string;
}
export interface AuthRequest extends Request {
    user?: AuthUser;
}
export declare function getUserFromToken(req: Request): AuthUser | null;
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireRoles(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
