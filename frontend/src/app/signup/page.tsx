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
    const [showPassword, setShowPassword] = useState(false);
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
                            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email Address</label>
                            <input
                                id="email"
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
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter your password"
                                required
                                style={{ paddingRight: '50px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
                        {loading ? 'Sign Up...' : 'Sign Up'}
                    </button>
                </form>

                <p className="text-center mt-4 text-muted" style={{ fontSize: '0.9rem' }}>
                    Already have an account? <Link href="/" style={{ color: 'var(--primary)' }}>Login</Link>
                </p>
            </div >
        </div >
    );
}
