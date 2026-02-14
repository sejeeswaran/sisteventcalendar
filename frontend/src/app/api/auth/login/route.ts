import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const INVALID_CREDENTIALS_MSG = 'Invalid credentials';

export async function POST(req: NextRequest) {
    try {
        const { email, registerNumber, password, role } = await req.json();

        if (!password || (!email && !registerNumber)) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        let user;

        if (registerNumber) {
            user = await handleStudentLogin(registerNumber, password);
            if (!user) return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        } else {
            try {
                user = await handleStaffLogin(email, password);
            } catch (err: any) {
                if (err.message === 'User data not found') return NextResponse.json({ error: err.message }, { status: 404 });
                return NextResponse.json({ error: err.message }, { status: 401 });
            }
        }

        if (role && user.role !== role) {
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return NextResponse.json({ message: 'Login successful', token, user });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function handleStudentLogin(registerNumber: string, password: string) {
    const snapshot = await getDb().collection('users').where('registerNumber', '==', registerNumber).get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const userData = doc.data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) return null;

    return {
        id: doc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
    };
}

async function handleStaffLogin(email: string, password: string) {
    if (!FIREBASE_API_KEY) throw new Error('Server configuration error: Missing API Key');

    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        headers: { 'Content-Type': 'application/json' }
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
        const errorMessage = verifyData.error?.message || 'Login failed';
        throw new Error(errorMessage === 'INVALID_LOGIN_CREDENTIALS' ? INVALID_CREDENTIALS_MSG : errorMessage);
    }

    const uid = verifyData.localId;
    const userDoc = await getDb().collection('users').doc(uid).get();

    if (!userDoc.exists) throw new Error('User data not found');

    const userData = userDoc.data();
    return {
        id: uid,
        name: userData?.name || 'User',
        email: userData?.email || email,
        role: userData?.role || 'STAFF'
    };
}
