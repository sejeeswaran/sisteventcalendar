import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { addHours, startOfHour, endOfHour } from 'date-fns';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars from root .env
config({ path: resolve(__dirname, '../.env') });

// Initialize Firebase Admin (Standalone)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}
const db = admin.firestore();

// Email Setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass',
    },
});

async function main() {
    console.log('Running reminder check...');

    const now = new Date();
    const tomorrowStart = startOfHour(addHours(now, 24));
    const tomorrowEnd = endOfHour(addHours(now, 24));

    // Firestore Query: Find events with date >= tomorrowStart AND date <= tomorrowEnd
    // Note: This requires 'date' to be stored as ISO string or Timestamp and indexed properly.
    // For simplicity, we fetch mostly relevant documents or stream if needed.
    // In production, use a composite index on 'date'.

    const eventsSnapshot = await db.collection('events')
        .where('date', '>=', tomorrowStart.toISOString())
        .where('date', '<=', tomorrowEnd.toISOString())
        .get();

    console.log(`Found ${eventsSnapshot.size} events starting around ${tomorrowStart.toISOString()}`);

    for (const doc of eventsSnapshot.docs) {
        const event = { id: doc.id, ...doc.data() } as any;

        // Get registrations for this event
        const regsSnapshot = await db.collection('registrations')
            .where('eventId', '==', event.id)
            .get();

        for (const regDoc of regsSnapshot.docs) {
            const reg = regDoc.data();
            // Fetch User
            const userDoc = await db.collection('users').doc(reg.userId).get();
            if (!userDoc.exists) continue;
            const user = userDoc.data() as any;

            if (!user.email) continue;

            // Send Email
            try {
                await transporter.sendMail({
                    from: '"College Events" <noreply@collegeevents.com>',
                    to: user.email,
                    subject: `Reminder: ${event.title} is tomorrow!`,
                    text: `Hi ${user.name},\n\nJust a reminder that ${event.title} is starting tomorrow at ${new Date(event.date).toLocaleTimeString()}.\nVenue: ${event.venue}\n\nSee you there!`,
                });
                console.log(`Sent reminder to ${user.email}`);

                // Create In-App Notification
                await db.collection('notifications').add({
                    userId: userDoc.id,
                    message: `Reminder: ${event.title} is tomorrow at ${new Date(event.date).toLocaleTimeString()}!`,
                    createdAt: new Date().toISOString()
                });

            } catch (error) {
                console.error(`Failed to send reminder to ${user.email}`, error);
            }
        }
    }

    console.log('Done.');
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
