import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

function getFirebaseAdmin() {
    if (!getApps().length) {
        try {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replaceAll(String.raw`\n`, '\n'),
                }),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            });
        } catch (error) {
            console.error('Firebase Admin Initialization Error:', error);
        }
    }
    return admin;
}

export function getDb() {
    return getFirebaseAdmin().firestore();
}

export function getAuth() {
    return getFirebaseAdmin().auth();
}

export function getStorage() {
    return getFirebaseAdmin().storage();
}
