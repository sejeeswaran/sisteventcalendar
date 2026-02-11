import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export function getUserFromToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}
// Middleware to require authentication
export function requireAuth(req, res, next) {
    const user = getUserFromToken(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
}
// Middleware to require specific roles
export function requireRoles(...roles) {
    return (req, res, next) => {
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
