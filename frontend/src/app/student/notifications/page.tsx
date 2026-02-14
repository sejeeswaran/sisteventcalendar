'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { format, parseISO } from 'date-fns';

export default function NotificationsPage() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            apiGet('/api/notifications')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setNotifications(data);
                })
                .finally(() => setLoading(false));
        }
    }, [token]);

    if (loading) return <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px', maxWidth: '800px' }}>
            <h1>Notifications</h1>
            <div className="card glass mt-4">
                {notifications.length === 0 ? (
                    <p className="text-muted">No notifications.</p>
                ) : (
                    <ul style={{ listStyle: 'none' }}>
                        {notifications.map(n => (
                            <li key={n.id} style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
                                <p style={{ fontWeight: n.isRead ? 'normal' : 'bold' }}>{n.message}</p>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{n.createdAt ? format(parseISO(n.createdAt), 'PPpp') : ''}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
