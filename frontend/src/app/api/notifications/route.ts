import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/firebase-admin';
import { getUserFromRequest } from '@/lib/server/auth';

// GET /api/notifications
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const snapshot = await getDb().collection('notifications')
            .where('userId', '==', user.userId)
            .orderBy('createdAt', 'desc')
            .get();

        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
