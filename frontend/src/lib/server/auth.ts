import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthUser {
    userId: string;
    email: string;
    role: string;
}

export function getUserFromRequest(req: NextRequest): AuthUser | null {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as AuthUser;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}
