'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { subHours, isAfter } from 'date-fns';

const EventPoster = ({ event }: { event: any }) => {
    if (!event.posterUrl) {
        return <div className="text-muted p-20">No Poster Available</div>;
    }

    // Extract ID to construct a direct image URL if possible
    const match = event.posterUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const fileId = match ? match[1] : null;
    const directUrl = fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : event.posterUrl;

    return (
        <>
            <img
                src={directUrl}
                alt={event.title || "Event Poster"}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const iframe = document.getElementById(`poster-iframe-${event.id}`);
                    if (iframe) iframe.style.display = 'block';
                }}
            />
            <iframe
                id={`poster-iframe-${event.id}`}
                src={event.posterUrl.replace('/view', '/preview')}
                title={event.title || "Event Poster"}
                width="100%"
                height="650"
                style={{ border: 'none', display: 'none' }}
                allow="autoplay"
            ></iframe>
        </>
    );
};

const RegistrationClosedMessage = () => (
    <div style={{
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        color: '#dc3545',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #dc3545',
        textAlign: 'center',
        fontWeight: '600'
    }}>
        Registration is closed. Must register 4 hours before event starts.
    </div>
);

export default function PosterPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();
    const { id } = use(params);
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) router.push('/');
        if (!isLoading && user && user.role !== 'STUDENT') router.push('/');
    }, [isLoading, user, router]);

    useEffect(() => {
        if (token && id) {
            fetchEvent();
        }
    }, [token, id]);

    const fetchEvent = async () => {
        try {
            const res = await apiGet(`/api/events/${id}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
            } else {
                alert('Event not found');
                router.push('/student/dashboard');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const registerUser = async () => {
        try {
            const res = await apiPost(`/api/events/${id}/register`, {});
            const data = await res.json();

            if (res.ok) {
                alert('Registration successful!');
                router.push('/student/registrations');
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            alert('Error registering');
        }
    };

    const isRegistrationClosed = () => {
        if (!event) return false;
        let eventStart: Date | null = null;
        if (event.date) {
            const parsed = new Date(event.date);
            if (!Number.isNaN(parsed.getTime())) eventStart = parsed;
        }

        if (!eventStart && event.dateOnly && event.fromTime) {
            eventStart = new Date(`${event.dateOnly}T${event.fromTime}`);
        }

        if (eventStart && !Number.isNaN(eventStart.getTime())) {
            const deadline = subHours(eventStart, 4);
            return isAfter(new Date(), deadline);
        }
        return false;
    };

    const closed = isRegistrationClosed();

    const handleProceed = () => {
        if (closed) return;

        if (event?.registrationLink) {
            globalThis.open(event.registrationLink, '_blank');
            setShowModal(true);
        } else {
            registerUser();
        }
    };

    const getButtonText = () => {
        if (closed) return 'Registration Closed';
        if (event.registrationLink) return 'Register & Fill Google Form';
        return 'Confirm Registration';
    };

    if (isLoading || loading) return <div className="container text-center pt-20">Loading...</div>;
    if (!event) return <div className="container text-center pt-20">Event not found</div>;

    return (
        <div className="container pt-10 pb-10">
            <button className="btn btn-outline mb-4" onClick={() => router.back()}>&larr; Back</button>

            <div className="card glass max-w-lg mx-auto p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h1>{event.title}</h1>
                    <p className="text-muted">{event.date ? new Date(event.date).toDateString() : 'TBD'} • {event.fromTime} - {event.toTime}</p>
                    <p>{event.venue} {event.room ? `(${event.room})` : ''}</p>
                </div>

                <div className="p-0 bg-black flex justify-center items-center" style={{ minHeight: '200px' }}>
                    <EventPoster event={event} />
                </div>

                <div className="p-6 pt-8 border-t border-gray-700" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {closed && <RegistrationClosedMessage />}
                    <button
                        className="btn btn-primary px-8"
                        onClick={handleProceed}
                        style={{ width: '100%' }}
                        disabled={closed}
                    >
                        {getButtonText()}
                    </button>
                    <button className="btn btn-outline" onClick={() => router.push('/student/dashboard')} style={{ width: '100%' }}>Cancel</button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card glass" style={{ maxWidth: '400px', width: '90%', padding: '24px', textAlign: 'center' }}>
                        <p style={{ marginBottom: '24px' }}>
                            The Google Form has been opened in a new tab. Please complete the form to finalize your registration.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                className="btn btn-primary"
                                onClick={registerUser}
                                style={{ width: '100%' }}
                            >
                                I have completed the form
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    if (event?.registrationLink) {
                                        globalThis.open(event.registrationLink, '_blank');
                                    }
                                }}
                                style={{ width: '100%' }}
                            >
                                Re-open Form
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
