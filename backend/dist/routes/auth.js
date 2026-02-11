import { Router } from 'express';
import { db, auth } from '../lib/firebase-admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const INVALID_CREDENTIALS_MSG = 'Invalid credentials';
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, registerNumber, password, role } = req.body;
        if (!password || (!email && !registerNumber)) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        let user;
        if (registerNumber) {
            user = await handleStudentLogin(registerNumber, password);
            if (!user)
                return res.status(401).json({ error: INVALID_CREDENTIALS_MSG });
        }
        else {
            try {
                user = await handleStaffLogin(email, password);
            }
            catch (err) {
                if (err.message === 'User data not found')
                    return res.status(404).json({ error: err.message });
                return res.status(401).json({ error: err.message });
            }
        }
        if (role && user.role !== role) {
            return res.status(401).json({ error: INVALID_CREDENTIALS_MSG });
        }
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({
            message: 'Login successful',
            token,
            user
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, registerNumber } = req.body;
        if (!name || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        let user;
        try {
            if (role === 'STUDENT') {
                user = await handleStudentRegister(name, registerNumber, role, password);
            }
            else {
                user = await handleStaffRegister(email, password, name, role);
            }
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({
            message: 'User registered successfully',
            token,
            user
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
});
async function handleStudentLogin(registerNumber, password) {
    const snapshot = await db.collection('users').where('registerNumber', '==', registerNumber).get();
    if (snapshot.empty)
        return null;
    const doc = snapshot.docs[0];
    const userData = doc.data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid)
        return null;
    return {
        id: doc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
    };
}
async function handleStaffLogin(email, password) {
    if (!FIREBASE_API_KEY)
        throw new Error('Server configuration error: Missing API Key');
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
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists)
        throw new Error('User data not found');
    const userData = userDoc.data();
    return {
        id: uid,
        name: userData?.name || 'User',
        email: userData?.email || email,
        role: userData?.role || 'STAFF'
    };
}
async function handleStudentRegister(name, registerNumber, role, password) {
    if (!registerNumber)
        throw new Error('Register Number is required for Students');
    const snapshot = await db.collection('users').where('registerNumber', '==', registerNumber).get();
    if (!snapshot.empty)
        throw new Error('Register Number already registered');
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = await db.collection('users').add({
        name,
        registerNumber,
        role,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    });
    return { id: newUserRef.id, registerNumber, role, name };
}
async function handleStaffRegister(email, password, name, role) {
    if (!email)
        throw new Error('Email is required');
    try {
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });
        await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            role,
            createdAt: new Date().toISOString()
        });
        return { id: userRecord.uid, email, role, name };
    }
    catch (error) {
        const firebaseError = error;
        if (firebaseError.code === 'auth/email-already-exists')
            throw new Error('Email already registered');
        if (firebaseError.code === 'auth/weak-password' || firebaseError.code === 'auth/invalid-password')
            throw new Error('Password should be at least 6 characters');
        if (firebaseError.code === 'auth/invalid-email')
            throw new Error('Invalid email address');
        throw error;
    }
}
export default router;
