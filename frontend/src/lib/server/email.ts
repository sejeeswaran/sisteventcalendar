import nodemailer from 'nodemailer';
import { getDb } from './firebase-admin';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass',
    },
});

export async function sendConfirmationEmail(to: string, eventDetails: any) {
    try {
        const info = await transporter.sendMail({
            from: '"College Events" <noreply@collegeevents.com>',
            to,
            subject: `Registration Confirmed: ${eventDetails.title}`,
            text: `Hello,\n\nYou have successfully registered for ${eventDetails.title}.\n\nDate: ${new Date(eventDetails.date).toLocaleString()}\nVenue: ${eventDetails.venue}\n\nSee you there!`,
            html: `<p>Hello,</p><p>You have successfully registered for <strong>${eventDetails.title}</strong>.</p><p><strong>Date:</strong> ${new Date(eventDetails.date).toLocaleString()}<br><strong>Venue:</strong> ${eventDetails.venue}</p><p>See you there!</p>`,
        });

        await getDb().collection('email_logs').add({
            to,
            subject: `Registration Confirmed: ${eventDetails.title}`,
            status: 'SENT',
            messageId: info.messageId,
            createdAt: new Date().toISOString()
        });

        console.log('Email sent:', info.messageId);
        return true;
    } catch (error: any) {
        console.error('Email sending failed:', error);

        await getDb().collection('email_logs').add({
            to,
            subject: `Registration Confirmed: ${eventDetails.title}`,
            status: 'FAILED',
            error: error.message,
            createdAt: new Date().toISOString()
        });
        return false;
    }
}
