import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/firebase-admin';
import { getUserFromRequest } from '@/lib/server/auth';
import { sendConfirmationEmail } from '@/lib/server/email';

// POST /api/events/[id]/register
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req);
    const { id } = await params;

    if (!user || user?.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized. Only students can register.' }, { status: 403 });
    }

    try {
        const eventRef = getDb().collection('events').doc(id);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const eventData = eventDoc.data();
        const event = {
            id: eventDoc.id,
            ...eventData,
            limit: eventData?.limit || 0,
            title: eventData?.title || '',
            date: eventData?.date,
            venue: eventData?.venue,
            organizerId: eventData?.organizerId
        };

        // Check limit
        if (event.limit > 0) {
            const registrationsSnapshot = await getDb().collection('registrations').where('eventId', '==', id).get();
            if (registrationsSnapshot.size >= event.limit) {
                return NextResponse.json({ error: 'Event is full' }, { status: 400 });
            }
        }

        // Check duplicate
        const existingSnapshot = await getDb().collection('registrations')
            .where('userId', '==', user.userId)
            .where('eventId', '==', id)
            .get();

        if (!existingSnapshot.empty) {
            return NextResponse.json({ error: 'Already registered' }, { status: 400 });
        }

        const newRegistration = {
            userId: user.userId,
            eventId: id,
            createdAt: new Date().toISOString()
        };

        const regRef = await getDb().collection('registrations').add(newRegistration);

        // Send Email (async, don't block response)
        try {
            await sendConfirmationEmail(user.email, event);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        // Create Notification for Student
        await getDb().collection('notifications').add({
            userId: user.userId,
            message: `You have successfully registered for the event: ${event.title}`,
            createdAt: new Date().toISOString()
        });

        // Create Notification for Organizer
        await getDb().collection('notifications').add({
            userId: event.organizerId,
            message: `New registration for ${event.title}: ${user.email}`,
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ message: 'Registered successfully', registration: { id: regRef.id, ...newRegistration } });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
