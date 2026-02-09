'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch
    if (!mounted) return <nav style={{ height: '80px', backgroundColor: 'var(--primary)' }}></nav>;

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: 'var(--primary)',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div className="container flex items-center justify-between" style={{ height: '80px' }}>
                <Link href="/" className="flex items-center">
                    <div style={{ position: 'relative', width: '280px', height: '65px' }}>
                        <Image
                            src="/college-logo-official.jpg"
                            alt="Sathyabama Logo"
                            fill
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </div>
                </Link>

                <div className="flex items-center">
                    {!user ? (
                        <>
                            <Link href="/" className="nav-link-animate" style={{ marginRight: '1.5rem', fontWeight: '500', color: 'white' }}>Login</Link>
                            <Link href="/signup" className="btn btn-animate" style={{ backgroundColor: 'white', color: 'var(--primary)', padding: '8px 20px' }}>Sign Up</Link>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center" style={{ marginRight: '1.5rem' }}>
                                {user.role === 'STUDENT' ? (
                                    <>
                                        <Link href="/student/dashboard" style={{ marginRight: '1rem', color: 'white' }}>Calendar</Link>
                                        <Link href="/student/registrations" style={{ marginRight: '1rem', color: 'white' }}>My Events</Link>
                                    </>
                                ) : user.role === 'STAFF' ? (
                                    <>
                                        <Link href="/staff/dashboard" style={{ marginRight: '1rem', color: 'white' }}>Dashboard</Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/organizer/dashboard" style={{ marginRight: '1rem', color: 'white' }}>Dashboard</Link>
                                    </>
                                )}
                            </div>
                            <div style={{ marginRight: '1.5rem', paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.9)' }}>
                                {user.name}
                            </div>
                            <button
                                onClick={logout}
                                className="btn btn-outline"
                                style={{
                                    padding: '6px 16px',
                                    fontSize: '0.85rem',
                                    borderColor: 'white',
                                    color: 'white',
                                    borderWidth: '1px'
                                }}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
