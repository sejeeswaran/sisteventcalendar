import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/firebase-admin';
import { getUserFromRequest } from '@/lib/server/auth';

// GET /api/events/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req);
    const { id } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const docRef = getDb().collection('events').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Get event error:', error);
        return NextResponse.json({ error: 'Error fetching event' }, { status: 500 });
    }
}

// PUT /api/events/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req);
    const { id } = await params;

    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const docRef = getDb().collection('events').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const eventData = doc.data();

        if (user.role !== 'ADMIN' && eventData?.organizerId !== user.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const updateData: any = {
            title: body.title,
            description: body.description,
            venue: body.venue,
            updatedAt: new Date().toISOString()
        };

        if (body.date) updateData.date = new Date(body.date).toISOString();
        if (body.limit) updateData.limit = Number.parseInt(body.limit);

        await docRef.update(updateData);

        return NextResponse.json({ id, ...eventData, ...updateData });
    } catch (error) {
        console.error('Update event error:', error);
        return NextResponse.json({ error: 'Error updating event' }, { status: 500 });
    }
}

// DELETE /api/events/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req);
    const { id } = await params;

    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const docRef = getDb().collection('events').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const eventData = doc.data();

        if (user.role !== 'ADMIN' && eventData?.organizerId !== user.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await docRef.delete();

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        return NextResponse.json({ error: 'Error deleting event' }, { status: 500 });
    }
}
