'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns';

interface Event {
    id: string;
    title: string;
    date: string;
    venue: string;
    posterUrl?: string;
    description: string;
    organizer: { name: string };
    organizerId: string;
}

export default function StaffDashboard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (!isLoading && !user) router.push('/');
        // Redirect if not eligible role (Staff or Admin)
        if (!isLoading && user && user.role !== 'STAFF' && user.role !== 'ADMIN') router.push('/');
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch all events for now, or filter by month range if API supported it.
                // Given API endpoint fetches all or by specific date. fetching all to populate calendar dots.
                const res = await apiGet('/api/events');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const calendarDays = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate))
    });

    const selectedEvents = events.filter(event => isSameDay(parseISO(event.date), selectedDate));



    if (isLoading || loading) return <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 350px', gap: '40px' }}>

                {/* Calendar Section */}
                <div className="card glass">
                    <div className="flex justify-between items-center mb-4">
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{format(currentDate, 'MMMM yyyy')}</h2>
                        <div className="flex" style={{ gap: '10px' }}>
                            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn btn-outline" style={{ padding: '8px 12px' }}>&lt;</button>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn btn-outline" style={{ padding: '8px 12px' }}>&gt;</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                        {calendarDays.map((day) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
                            const hasEvent = dayEvents.length > 0;

                            const dayStyle = {
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column' as const,
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                background: isSelected ? 'var(--primary)' : (isCurrentMonth ? 'rgba(255,255,255,0.05)' : 'transparent'),
                                color: isSelected ? 'white' : (isCurrentMonth ? 'inherit' : 'var(--text-muted)'),
                                border: isSelected ? 'none' : '1px solid var(--border)',
                                position: 'relative' as const
                            };

                            return (
                                <div
                                    key={day.toISOString()}
                                    className="calendar-day"
                                    onClick={() => setSelectedDate(day)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            setSelectedDate(day);
                                        }
                                    }}
                                    style={dayStyle}
                                >
                                    <span>{format(day, 'd')}</span>
                                    {hasEvent && (
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? 'white' : 'var(--secondary)', marginTop: '4px' }}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Events List Section */}
                <div>
                    <h3 style={{ marginBottom: '20px' }}>Events for {format(selectedDate, 'MMM do')}</h3>

                    {selectedEvents.length === 0 ? (
                        <p className="text-muted">No events scheduled for this day.</p>
                    ) : (
                        <div className="grid" style={{ gap: '20px' }}>
                            {selectedEvents.map(event => (
                                <div key={event.id} className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
                                    <h4>{event.title}</h4>
                                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>{format(parseISO(event.date), 'p')} • {event.venue}</p>
                                    <p style={{ margin: '10px 0', fontSize: '0.95rem' }}>{event.description}</p>
                                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '16px' }}>By {event.organizer.name}</p>

                                    {/* Staff Logic: View Attendees for ALL events */}
                                    <button
                                        onClick={() => router.push(`/organizer/events/${event.id}/attendees`)}
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '8px' }}
                                    >
                                        View Attendees
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
