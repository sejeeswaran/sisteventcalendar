import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/firebase-admin';
import { getUserFromRequest } from '@/lib/server/auth';
import { startOfDay, endOfDay } from 'date-fns';

// GET /api/events
export async function GET(req: NextRequest) {
    const dateStr = req.nextUrl.searchParams.get('date');

    try {
        const eventsRef = getDb().collection('events');
        const snapshot = await eventsRef.orderBy('date', 'asc').get();
        let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (dateStr) {
            const searchDate = new Date(dateStr);
            const start = startOfDay(searchDate);
            const end = endOfDay(searchDate);

            events = events.filter((event: any) => {
                const eventDate = new Date(event.date);
                return eventDate >= start && eventDate <= end;
            });
        }

        // Fetch organizer details
        const organizerIds = [...new Set(events.map((e: any) => e.organizerId))];
        const organizerPromises = organizerIds.map(id => getDb().collection('users').doc(id).get());
        const organizerSnapshots = await Promise.all(organizerPromises);
        const organizers = Object.fromEntries(organizerSnapshots.map(doc => [doc.id, doc.data()]));

        const enrichedEvents = events.map((event: any) => ({
            ...event,
            organizer: organizers[event.organizerId] ? {
                name: organizers[event.organizerId]?.name,
                email: organizers[event.organizerId]?.email
            } : null
        }));

        return NextResponse.json(enrichedEvents);
    } catch (error) {
        console.error('Fetch events error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/events
export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);

    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const {
            title, description, date, fromTime, toTime,
            venue, room, manualVenue,
            category, posterUrl, posterType, limit,
            registrationLink
        } = await req.json();

        if (!title || !date || !fromTime || !toTime || !venue) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const fullDate = new Date(`${date}T${fromTime}`);

        const newEvent = {
            title,
            description: description || '',
            date: fullDate.toISOString(),
            dateOnly: date,
            fromTime,
            toTime,
            venue,
            room: room || '',
            manualVenue: !!manualVenue,
            category: category || 'General',
            posterUrl: posterUrl || '',
            posterType: posterType || 'image/jpeg',
            registrationLink: registrationLink || '',
            limit: Number.parseInt(limit) || 0,
            organizerId: user.userId,
            createdAt: new Date().toISOString()
        };

        const docRef = await getDb().collection('events').add(newEvent);

        return NextResponse.json({ id: docRef.id, ...newEvent });
    } catch (error) {
        console.error('Create event error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
