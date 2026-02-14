import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAuth } from '@/lib/server/firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, role, registerNumber } = await req.json();

        if (!name || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let user;

        try {
            if (role === 'STUDENT') {
                user = await handleStudentRegister(name, registerNumber, role, password, email);
            } else {
                user = await handleStaffRegister(email, password, name, role);
            }
        } catch (err: any) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return NextResponse.json({ message: 'User registered successfully', token, user });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

async function handleStudentRegister(name: string, registerNumber: string, role: string, password: string, email?: string) {
    if (!registerNumber) throw new Error('Register Number is required for Students');

    const snapshot = await getDb().collection('users').where('registerNumber', '==', registerNumber).get();
    if (!snapshot.empty) throw new Error('Register Number already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserRef = await getDb().collection('users').add({
        name,
        registerNumber,
        email: email || null,
        role,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    });

    return { id: newUserRef.id, registerNumber, role, name, email };
}

async function handleStaffRegister(email: string, password: string, name: string, role: string) {
    if (!email) throw new Error('Email is required');

    try {
        const userRecord = await getAuth().createUser({
            email,
            password,
            displayName: name,
        });

        await getDb().collection('users').doc(userRecord.uid).set({
            name,
            email,
            role,
            createdAt: new Date().toISOString()
        });

        return { id: userRecord.uid, email, role, name };
    } catch (error: any) {
        const firebaseError = error as { code?: string; message: string };
        if (firebaseError.code === 'auth/email-already-exists') throw new Error('Email already registered');
        if (firebaseError.code === 'auth/weak-password' || firebaseError.code === 'auth/invalid-password') throw new Error('Password should be at least 6 characters');
        if (firebaseError.code === 'auth/invalid-email') throw new Error('Invalid email address');
        throw error;
    }
}
