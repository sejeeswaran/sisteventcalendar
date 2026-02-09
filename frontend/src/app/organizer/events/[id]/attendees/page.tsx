'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { format } from 'date-fns';

interface Attendee {
    id: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        registerNumber: string;
    } | null;
    registeredAt: string;
}

interface Event {
    id: string;
    title: string;
    date: string;
    venue: string;
}

export default function AttendeesPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();
    const { id } = use(params);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) router.push('/');
        if (!isLoading && user && user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'STAFF') router.push('/');
    }, [isLoading, user, router]);

    useEffect(() => {
        if (token && id) {
            fetchData();
        }
    }, [token, id]);

    const fetchData = async () => {
        try {
            // Fetch event details
            const eventRes = await apiGet(`/api/events/${id}`);
            if (eventRes.ok) {
                const eventData = await eventRes.json();
                setEvent(eventData);
            }

            // Fetch attendees
            const attendeesRes = await apiGet(`/api/events/${id}/attendees`);
            if (attendeesRes.ok) {
                const data = await attendeesRes.json();
                setAttendees(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!attendees.length) {
            alert('No attendees to export');
            return;
        }

        // Create CSV content
        const headers = ['S.No', 'Register Number', 'Name', 'Email', 'Registered At'];
        const csvContent = [
            headers.join(','),
            ...attendees.map((attendee, index) => [
                index + 1,
                attendee.user?.registerNumber || 'N/A',
                `"${attendee.user?.name || 'Unknown'}"`,
                attendee.user?.email || 'N/A',
                attendee.registeredAt ? format(new Date(attendee.registeredAt), 'MMM d, yyyy h:mm a') : 'N/A'
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${event?.title || 'event'}_attendees_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading || loading) return <div className="container text-center pt-20">Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <div className="flex gap-2 mb-4">
                <button className="btn btn-outline" onClick={() => router.back()}>&larr; Back to Dashboard</button>
                {attendees.length > 0 && (
                    <button
                        className="btn"
                        style={{ background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)', color: 'white' }}
                        onClick={exportToExcel}
                    >
                        Export to Excel
                    </button>
                )}
            </div>

            <div className="card glass">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1>Event Attendees</h1>
                        {event && (
                            <p className="text-muted">{event.title} • {event.venue}</p>
                        )}
                    </div>
                    <div style={{
                        background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                        padding: '16px 28px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(139, 0, 0, 0.4)'
                    }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{attendees.length}</div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>Registered</div>
                    </div>
                </div>

                {attendees.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '40px' }}>
                        <h3>No registrations yet</h3>
                        <p>Students who register will appear here.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--primary)' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>#</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Register Number</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Registered At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees.map((attendee, index) => (
                                    <tr key={attendee.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                        <td style={{ padding: '12px 16px', color: '#333' }}>{index + 1}</td>
                                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#333' }}>
                                            {attendee.user?.registerNumber || 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#333' }}>
                                            {attendee.user?.name || 'Unknown'}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#666' }}>
                                            {attendee.user?.email || 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--primary)', minWidth: '180px', whiteSpace: 'nowrap', fontWeight: '500' }}>
                                            {attendee.registeredAt
                                                ? format(new Date(attendee.registeredAt), 'MMM d, yyyy h:mm a')
                                                : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
