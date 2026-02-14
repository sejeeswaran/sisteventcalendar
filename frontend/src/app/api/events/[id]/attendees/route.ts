import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/firebase-admin';
import { getUserFromRequest } from '@/lib/server/auth';

// GET /api/events/[id]/attendees
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req);
    const { id } = await params;

    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const eventDoc = await getDb().collection('events').doc(id).get();
        if (!eventDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const eventData = eventDoc.data();
        if (user.role !== 'ADMIN' && user.role !== 'STAFF' && eventData?.organizerId !== user.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const registrationsSnapshot = await getDb().collection('registrations')
            .where('eventId', '==', id)
            .get();

        const registrations = registrationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch user details for each registration
        const userIds = [...new Set(registrations.map((r: any) => r.userId))];
        const userPromises = userIds.map(uid => getDb().collection('users').doc(uid).get());
        const userSnapshots = await Promise.all(userPromises);
        const users = Object.fromEntries(userSnapshots.map(doc => [doc.id, doc.data()]));

        const enrichedRegistrations = registrations.map((reg: any) => ({
            ...reg,
            user: users[reg.userId] ? {
                id: reg.userId,
                name: users[reg.userId]?.name || 'Unknown',
                email: users[reg.userId]?.email || 'N/A',
                registerNumber: users[reg.userId]?.registerNumber || 'N/A'
            } : null,
            registeredAt: reg.registeredAt || reg.createdAt || null
        }));

        return NextResponse.json(enrichedRegistrations);
    } catch (error) {
        console.error('Error fetching attendees:', error);
        return NextResponse.json({ error: 'Error fetching attendees' }, { status: 500 });
    }
}
