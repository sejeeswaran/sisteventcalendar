import { Router, Response } from 'express';
import { db } from '../lib/firebase-admin.js';
import { getUserFromToken, AuthRequest } from '../lib/auth.js';

const router = Router();

// GET /api/registrations
router.get('/', async (req: AuthRequest, res: Response) => {
    const user = getUserFromToken(req);

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Fetching registrations for user:', user.userId);

    try {
        const registrationsSnapshot = await db.collection('registrations')
            .where('userId', '==', user.userId)
            .get();

        console.log('Found registrations count:', registrationsSnapshot.size);

        const registrations = registrationsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

        // Fetch related event details manually
        const eventIds = [...new Set(registrations.map((r: any) => r.eventId))];

        if (eventIds.length === 0) {
            return res.json([]);
        }

        const eventPromises = eventIds.map(id => db.collection('events').doc(id).get());
        const eventSnapshots = await Promise.all(eventPromises);
        const events = Object.fromEntries(eventSnapshots.map(doc => [doc.id, doc.data()]));

        const enrichedRegistrations = registrations
            .map((reg: any) => ({
                ...reg,
                event: events[reg.eventId] ? { id: reg.eventId, ...events[reg.eventId] } : null
            }))
            .filter((reg: any) => reg.event !== null);

        return res.json(enrichedRegistrations);
    } catch (error) {
        console.error('Fetch registrations error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
