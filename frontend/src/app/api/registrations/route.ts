import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/firebase-admin';
import { getUserFromRequest } from '@/lib/server/auth';

// GET /api/registrations
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const registrationsSnapshot = await getDb().collection('registrations')
            .where('userId', '==', user.userId)
            .get();

        const registrations = registrationsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

        // Fetch related event details
        const eventIds = [...new Set(registrations.map((r: any) => r.eventId))];

        if (eventIds.length === 0) {
            return NextResponse.json([]);
        }

        const eventPromises = eventIds.map(id => getDb().collection('events').doc(id).get());
        const eventSnapshots = await Promise.all(eventPromises);
        const events = Object.fromEntries(eventSnapshots.map(doc => [doc.id, doc.data()]));

        const enrichedRegistrations = registrations
            .map((reg: any) => ({
                ...reg,
                event: events[reg.eventId] ? { id: reg.eventId, ...events[reg.eventId] } : null
            }))
            .filter((reg: any) => reg.event !== null);

        return NextResponse.json(enrichedRegistrations);
    } catch (error) {
        console.error('Fetch registrations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
