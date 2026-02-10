import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

if (!getApps().length) {
    try {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
        console.log('Firebase Admin Initialized successfully');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
