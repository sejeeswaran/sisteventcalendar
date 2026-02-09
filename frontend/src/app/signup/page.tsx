'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import Link from 'next/link';
export default function SignupPage() {
    const [activeTab, setActiveTab] = useState('STUDENT'); // STUDENT, ADMIN, STAFF
    const [formData, setFormData] = useState({
        name: '',
        registerNumber: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Include role in payload
            const payload = { ...formData, role: activeTab };

            const res = await apiPost('/api/auth/register', payload);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Registration successful
            alert('Registration successful! Please login.');
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container flex items-center justify-between" style={{ minHeight: '80vh', justifyContent: 'center' }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '450px', padding: '30px' }}>
                <h2 className="text-center" style={{ marginBottom: '24px', fontWeight: 'bold' }}>Create Account</h2>

                <div className="flex justify-between" style={{ marginBottom: '20px', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('STUDENT'); setError(''); }}
                        className={`btn ${activeTab === 'STUDENT' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('STAFF'); setError(''); }}
                        className={`btn ${activeTab === 'STAFF' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
                    >
                        Staff
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('ADMIN'); setError(''); }}
                        className={`btn ${activeTab === 'ADMIN' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
                    >
                        Admin
                    </button>
                </div>

                {error && <div style={{ background: 'rgba(128, 0, 32, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Full Name</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    {activeTab === 'STUDENT' && (
                        <div style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Register Number</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.registerNumber}
                                onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                                placeholder="Enter your registration number"
                                required
                            />
                        </div>
                    )}

                    {activeTab !== 'STUDENT' && (
                        <div style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email Address</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter your email address"
                                required={activeTab !== 'STUDENT'}
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            className="input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
                        {loading ? 'Sign Up...' : 'Sign Up'}
                    </button>
                </form>

                <p className="text-center mt-4 text-muted" style={{ fontSize: '0.9rem' }}>
                    Already have an account? <Link href="/" style={{ color: 'var(--primary)' }}>Login</Link>
                </p>
            </div>
        </div>
    );
}
