import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/firebase-admin';
import { firestore } from 'firebase-admin';
import { getUserFromRequest, AuthUser } from '@/lib/server/auth';
import { sendConfirmationEmail } from '@/lib/server/email';
import { subHours, isAfter } from 'date-fns';

// --- Helper Functions ---

interface EventData {
    date?: string;
    dateOnly?: string;
    fromTime?: string;
    title?: string;
    limit?: number;
    venue?: string;
    organizerId?: string;
}

function getEventStartDate(event: EventData): Date | null {
    if (event.date) {
        const parsed = new Date(event.date);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    if (event.dateOnly && event.fromTime) {
        const constructed = new Date(`${event.dateOnly}T${event.fromTime}`);
        if (!Number.isNaN(constructed.getTime())) return constructed;
    }
    return null;
}

function processEventData(doc: firestore.DocumentSnapshot) {
    const data = doc.data();
    if (!data) return null;
    return {
        id: doc.id,
        ...data,
        limit: data.limit || 0,
        title: data.title || '',
        date: data.date,
        dateOnly: data.dateOnly,
        fromTime: data.fromTime,
        venue: data.venue,
        organizerId: data.organizerId
    };
}

function checkDeadlines(eventStart: Date | null): string | null {
    if (!eventStart) return null;
    const deadline = subHours(eventStart, 4);
    if (isAfter(new Date(), deadline)) {
        return 'Registration closed. Registration must be completed at least 4 hours before the event starts.';
    }
    return null;
}

async function updateNotifications(user: AuthUser, event: EventData) {
    try {
        const db = getDb();
        const batch = db.batch();

        // Student Notification
        const studentNotifRef = db.collection('notifications').doc();
        batch.set(studentNotifRef, {
            userId: user.userId,
            message: `You have successfully registered for the event: ${event.title}`,
            createdAt: new Date().toISOString()
        });

        // Organizer Notification
        if (event.organizerId) {
            const orgNotifRef = db.collection('notifications').doc();
            batch.set(orgNotifRef, {
                userId: event.organizerId,
                message: `New registration for ${event.title}: ${user.email}`,
                createdAt: new Date().toISOString()
            });
        }

        await batch.commit();

        // Email (async)
        // We'll run this concurrently but won't block the main response if it fails, or just log error inside.
        // It's already wrapped in try-catch in email.ts but calling it here.
        await sendConfirmationEmail(user.email, event);
    } catch (error) {
        console.error('Notification/Email error:', error);
    }
}

// --- Main Handler ---

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req);
    const { id } = await params;

    if (user?.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized. Only students can register.' }, { status: 403 });
    }

    try {
        const db = getDb();
        const eventDoc = await db.collection('events').doc(id).get();

        if (!eventDoc.exists) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const event = processEventData(eventDoc);
        if (!event) {
            return NextResponse.json({ error: 'Event data invalid' }, { status: 500 });
        }

        // 1. Check Deadline
        const eventStart = getEventStartDate(event);
        const deadlineError = checkDeadlines(eventStart);
        if (deadlineError) {
            return NextResponse.json({ error: deadlineError }, { status: 400 });
        }

        // 2. Check Capacity (Limit)
        if (event.limit > 0) {
            const registrationsSnapshot = await db.collection('registrations').where('eventId', '==', id).get();
            if (registrationsSnapshot.size >= event.limit) {
                return NextResponse.json({ error: 'Event is full' }, { status: 400 });
            }
        }

        // 3. Check Duplicate Registration
        const existingSnapshot = await db.collection('registrations')
            .where('userId', '==', user.userId)
            .where('eventId', '==', id)
            .get();

        if (!existingSnapshot.empty) {
            return NextResponse.json({ error: 'Already registered' }, { status: 400 });
        }

        // 4. Register
        const newRegistration = {
            userId: user.userId,
            eventId: id,
            createdAt: new Date().toISOString()
        };
        const regRef = await db.collection('registrations').add(newRegistration);

        // 5. Notify
        await updateNotifications(user, event);

        return NextResponse.json({
            message: 'Registered successfully',
            registration: { id: regRef.id, ...newRegistration }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
