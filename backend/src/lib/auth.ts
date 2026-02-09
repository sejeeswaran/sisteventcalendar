import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthUser {
    userId: string;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

export function getUserFromToken(req: Request): AuthUser | null {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as AuthUser;
    } catch (error) {
        return null;
    }
}

// Middleware to require authentication
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const user = getUserFromToken(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
}

// Middleware to require specific roles
export function requireRoles(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.user = user;
        next();
    };
}
