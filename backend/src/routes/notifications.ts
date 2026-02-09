import { Router, Response } from 'express';
import { db } from '../lib/firebase-admin.js';
import { getUserFromToken, AuthRequest } from '../lib/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', user.userId)
            .orderBy('createdAt', 'desc')
            .get();

        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json(notifications);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return res.status(500).json({ error: 'Error' });
    }
});

export default router;
