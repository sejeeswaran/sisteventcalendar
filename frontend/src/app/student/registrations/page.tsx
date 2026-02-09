'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { format, parseISO } from 'date-fns';

export default function MyRegistrations() {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) router.push('/');
        if (!isLoading && user && user.role !== 'STUDENT') router.push('/organizer/dashboard');
    }, [user, isLoading, router]);

    useEffect(() => {
        if (token) {
            apiGet('/api/registrations')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch');
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        setRegistrations(data);
                    } else {
                        console.error('Invalid data received:', data);
                    }
                })
                .catch(err => console.error('Error loading registrations:', err))
                .finally(() => setLoading(false));
        }
    }, [token]);

    if (loading) return <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <h1>My Registrations</h1>
            <div className="grid grid-cols-3" style={{ marginTop: '20px' }}>
                {registrations.length === 0 ? (
                    <p className="text-muted">You haven't registered for any events yet.</p>
                ) : (
                    registrations.map(reg => (
                        <div key={reg.id} className="card glass">
                            <h3>{reg.event.title}</h3>
                            <p className="text-muted">{format(parseISO(reg.event.date), 'PPpp')}</p>
                            <p>{reg.event.venue}</p>
                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    background: reg.status === 'REGISTERED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: reg.status === 'REGISTERED' ? '#10b981' : '#ef4444'
                                }}>
                                    {reg.status}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Registered on {format(parseISO(reg.createdAt), 'P')}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
