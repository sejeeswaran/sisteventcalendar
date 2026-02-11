import { Router } from 'express';
import { db } from '../lib/firebase-admin.js';
import { getUserFromToken } from '../lib/auth.js';
import { sendConfirmationEmail } from '../lib/email.js';
import { startOfDay, endOfDay } from 'date-fns';
const router = Router();
// GET /api/events
router.get('/', async (req, res) => {
    const dateStr = req.query.date;
    try {
        const eventsRef = db.collection('events');
        const snapshot = await eventsRef.orderBy('date', 'asc').get();
        let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (dateStr) {
            const searchDate = new Date(dateStr);
            const start = startOfDay(searchDate);
            const end = endOfDay(searchDate);
            events = events.filter((event) => {
                const eventDate = new Date(event.date);
                return eventDate >= start && eventDate <= end;
            });
        }
        // Fetch organizer details
        const organizerIds = [...new Set(events.map((e) => e.organizerId))];
        const organizerPromises = organizerIds.map(id => db.collection('users').doc(id).get());
        const organizerSnapshots = await Promise.all(organizerPromises);
        const organizers = Object.fromEntries(organizerSnapshots.map(doc => [doc.id, doc.data()]));
        const enrichedEvents = events.map((event) => ({
            ...event,
            organizer: organizers[event.organizerId] ? {
                name: organizers[event.organizerId]?.name,
                email: organizers[event.organizerId]?.email
            } : null
        }));
        return res.json(enrichedEvents);
    }
    catch (error) {
        console.error('Fetch events error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/events
router.post('/', async (req, res) => {
    const user = getUserFromToken(req);
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { title, description, date, fromTime, toTime, venue, room, manualVenue, category, posterUrl, posterType, limit, registrationLink } = req.body;
        if (!title || !date || !fromTime || !toTime || !venue) {
            return res.status(400).json({ error: 'Missing required fields' });
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
        const docRef = await db.collection('events').add(newEvent);
        return res.json({ id: docRef.id, ...newEvent });
    }
    catch (error) {
        console.error('Create event error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/events/:id
router.get('/:id', async (req, res) => {
    const user = getUserFromToken(req);
    const id = req.params.id;
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const docRef = db.collection('events').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Event not found' });
        }
        return res.json({ id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error("Get event error:", error);
        return res.status(500).json({ error: 'Error fetching event' });
    }
});
// PUT /api/events/:id
router.put('/:id', async (req, res) => {
    const user = getUserFromToken(req);
    const id = req.params.id;
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const docRef = db.collection('events').doc(id);
        const doc = await docRef.get();
        if (!doc.exists)
            return res.status(404).json({ error: 'Not found' });
        const eventData = doc.data();
        if (user.role !== 'ADMIN' && eventData?.organizerId !== user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const body = req.body;
        const updateData = {
            title: body.title,
            description: body.description,
            venue: body.venue,
            updatedAt: new Date().toISOString()
        };
        if (body.date)
            updateData.date = new Date(body.date).toISOString();
        if (body.limit)
            updateData.limit = Number.parseInt(body.limit);
        await docRef.update(updateData);
        return res.json({ id, ...eventData, ...updateData });
    }
    catch (error) {
        console.error("Update event error:", error);
        return res.status(500).json({ error: 'Error updating event' });
    }
});
// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
    const user = getUserFromToken(req);
    const id = req.params.id;
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const docRef = db.collection('events').doc(id);
        const doc = await docRef.get();
        if (!doc.exists)
            return res.status(404).json({ error: 'Not found' });
        const eventData = doc.data();
        if (user.role !== 'ADMIN' && eventData?.organizerId !== user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        await docRef.delete();
        return res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        console.error("Delete event error:", error);
        return res.status(500).json({ error: 'Error deleting event' });
    }
});
// POST /api/events/:id/register
router.post('/:id/register', async (req, res) => {
    const user = getUserFromToken(req);
    const id = req.params.id;
    if (!user || user?.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Unauthorized. Only students can register.' });
    }
    try {
        const eventRef = db.collection('events').doc(id);
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) {
            return res.status(404).json({ error: 'Event not found' });
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
            const registrationsSnapshot = await db.collection('registrations').where('eventId', '==', id).get();
            if (registrationsSnapshot.size >= event.limit) {
                return res.status(400).json({ error: 'Event is full' });
            }
        }
        // Check duplicate
        const existingSnapshot = await db.collection('registrations')
            .where('userId', '==', user.userId)
            .where('eventId', '==', id)
            .get();
        if (!existingSnapshot.empty) {
            return res.status(400).json({ error: 'Already registered' });
        }
        const newRegistration = {
            userId: user.userId,
            eventId: id,
            createdAt: new Date().toISOString()
        };
        const regRef = await db.collection('registrations').add(newRegistration);
        // Send Email (async, don't block response)
        try {
            await sendConfirmationEmail(user.email, event);
        }
        catch (emailError) {
            console.error('Email sending failed:', emailError);
        }
        // Create Notification for Student
        await db.collection('notifications').add({
            userId: user.userId,
            message: `You have successfully registered for the event: ${event.title}`,
            createdAt: new Date().toISOString()
        });
        // Create Notification for Organizer
        await db.collection('notifications').add({
            userId: event.organizerId,
            message: `New registration for ${event.title}: ${user.email}`,
            createdAt: new Date().toISOString()
        });
        return res.json({ message: 'Registered successfully', registration: { id: regRef.id, ...newRegistration } });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/events/:id/attendees
router.get('/:id/attendees', async (req, res) => {
    const user = getUserFromToken(req);
    const id = req.params.id;
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const eventDoc = await db.collection('events').doc(id).get();
        if (!eventDoc.exists)
            return res.status(404).json({ error: 'Not found' });
        const eventData = eventDoc.data();
        if (user.role !== 'ADMIN' && user.role !== 'STAFF' && eventData?.organizerId !== user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const registrationsSnapshot = await db.collection('registrations')
            .where('eventId', '==', id)
            .get();
        const registrations = registrationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Fetch user details for each registration
        const userIds = [...new Set(registrations.map((r) => r.userId))];
        const userPromises = userIds.map(uid => db.collection('users').doc(uid).get());
        const userSnapshots = await Promise.all(userPromises);
        const users = Object.fromEntries(userSnapshots.map(doc => [doc.id, doc.data()]));
        const enrichedRegistrations = registrations.map((reg) => ({
            ...reg,
            user: users[reg.userId] ? {
                id: reg.userId,
                name: users[reg.userId]?.name || 'Unknown',
                email: users[reg.userId]?.email || 'N/A',
                registerNumber: users[reg.userId]?.registerNumber || 'N/A'
            } : null,
            registeredAt: reg.registeredAt || reg.createdAt || null
        }));
        return res.json(enrichedRegistrations);
    }
    catch (error) {
        console.error('Error fetching attendees:', error);
        return res.status(500).json({ error: 'Error fetching attendees' });
    }
});
export default router;
