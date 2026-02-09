import { Router, Request, Response } from 'express';
import { db, auth } from '../lib/firebase-admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, registerNumber, password, role } = req.body;

        if (!password || (!email && !registerNumber)) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        let user;

        // 1. Student Login (Custom Firestore Auth)
        if (registerNumber) {
            const snapshot = await db.collection('users').where('registerNumber', '==', registerNumber).get();

            if (snapshot.empty) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const doc = snapshot.docs[0];
            const userData = doc.data();

            const isPasswordValid = await bcrypt.compare(password, userData.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            user = {
                id: doc.id,
                name: userData.name,
                email: userData.email,
                role: userData.role
            };
        }
        // 2. Admin/Staff Login (Firebase Auth REST API)
        else {
            if (!FIREBASE_API_KEY) {
                return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
            }

            const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
                const errorMessage = verifyData.error?.message || 'Login failed';
                return res.status(401).json({ error: errorMessage === 'INVALID_LOGIN_CREDENTIALS' ? 'Invalid credentials' : errorMessage });
            }

            const uid = verifyData.localId;
            const userDoc = await db.collection('users').doc(uid).get();

            if (!userDoc.exists) {
                return res.status(404).json({ error: 'User data not found' });
            }

            const userData = userDoc.data();
            user = {
                id: uid,
                name: userData?.name || 'User',
                email: userData?.email || email,
                role: userData?.role || 'STAFF'
            };
        }

        // 3. Enforce Role Check
        if (role && user.role !== role) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 4. Generate Session Token (JWT)
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.json({
            message: 'Login successful',
            token,
            user
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, registerNumber } = req.body;

        if (!name || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let user;

        // Student Registration (Custom Firestore Auth)
        if (role === 'STUDENT') {
            if (!registerNumber) {
                return res.status(400).json({ error: 'Register Number is required for Students' });
            }

            const snapshot = await db.collection('users').where('registerNumber', '==', registerNumber).get();
            if (!snapshot.empty) {
                return res.status(400).json({ error: 'Register Number already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUserRef = await db.collection('users').add({
                name,
                registerNumber,
                role,
                password: hashedPassword,
                createdAt: new Date().toISOString()
            });

            user = { id: newUserRef.id, registerNumber, role, name };
        }
        // Admin/Staff Registration (Firebase Auth)
        else {
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

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

                user = { id: userRecord.uid, email, role, name };

            } catch (error: any) {
                if (error.code === 'auth/email-already-exists') {
                    return res.status(400).json({ error: 'Email already registered' });
                }
                if (error.code === 'auth/weak-password' || error.code === 'auth/invalid-password') {
                    return res.status(400).json({ error: 'Password should be at least 6 characters' });
                }
                if (error.code === 'auth/invalid-email') {
                    return res.status(400).json({ error: 'Invalid email address' });
                }
                throw error;
            }
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.json({
            message: 'User registered successfully',
            token,
            user
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
