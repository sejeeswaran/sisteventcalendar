'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { format, parseISO } from 'date-fns';

const BUILDINGS = [
    'Administrative Block', 'Colonel Dr. Jeppiaar Memorial Block', 'Central Library', 'Colonel Dr. Jeppiaar Research Park',
    'St. Paul’s Block', 'Centre for Advanced Studies – Annexure I', 'Centre for Advanced Studies – Annexure II', 'Centre for Advanced Studies – Annexure III',
    'Centre for Advanced Studies – Seminar Hall I', 'Centre for Advanced Studies – Seminar Hall II', 'Centre for Advanced Studies – Seminar Hall III',
    'Class Room Block 01', 'Class Room Block 02', 'Class Room Block 03', 'Class Room Block 04', 'Class Room Block 06', 'Class Room Block 07', 'Class Room Block 08',
    'Class Room Block 14', 'Class Room Block 15', 'Class Room Block 16', 'Class Room Block 18', 'Class Room Block 19',
    'Department of Computer Science & Engineering', 'Computer Science Laboratory', 'Department of Information Technology', 'Department of Electronics & Communication Engineering',
    'Department of Electrical & Electronics Engineering', 'Department of Mechanical Engineering', 'Machine Shop & Drawing Hall', 'Fluid Mechanics Laboratory', 'Thermal Laboratory', 'Department of Chemical Engineering', 'Department of Aeronautical Engineering',
    'Department of Automobile Engineering', 'Bio-Medical Laboratory', 'Department of Physics, Chemistry & Mathematics', 'Department of Civil Engineering',
    'Department of Biotechnology & Biomedical Engineering', 'Department of Visual Communication', 'Department of Architecture', 'Department of Fashion Design',
    'School of Law', 'School of Pharmacy', 'School of Management Studies', 'School of Nursing', 'Dental College & Hospital',
    'Student Activity Centre', 'Open Air Theatre (OAT)', 'Sathyabama Indoor Auditorium', 'Dr. Remibai Jeppiaar Auditorium', 'Main Auditorium'
];

export default function OrganizerDashboard() {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [attendees, setAttendees] = useState<{ [key: string]: any[] }>({});
    const [viewingAttendees, setViewingAttendees] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '', description: '', date: '', fromTime: '', toTime: '',
        venue: '', room: '', manualVenue: false,
        category: 'Tech', posterUrl: '', posterType: '', limit: '0',
        registrationLink: ''
    });

    const [posterFile, setPosterFile] = useState<File | null>(null);

    useEffect(() => {
        if (!isLoading && !user) router.push('/');
        if (!isLoading && user && user.role !== 'ORGANIZER' && user.role !== 'ADMIN') router.push('/student/dashboard');
    }, [user, isLoading, router]);

    useEffect(() => {
        if (token && (user?.role === 'ORGANIZER' || user?.role === 'ADMIN')) {
            fetchEvents();
        }
    }, [token, user]);

    const fetchEvents = async () => {
        const res = await apiGet('/api/events');
        const data = await res.json();
        if (Array.isArray(data)) {
            setEvents(data.filter((e: any) => user?.role === 'ADMIN' ? true : e.organizerId === user?.id));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('File size exceeds 5MB');
                return;
            }
            if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
                alert('Only PDF and Image files are allowed');
                return;
            }
            setPosterFile(file);
        }
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove the "data:*/*;base64," prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) return;
        setUploading(true);

        try {
            let uploadedPosterUrl = formData.posterUrl;
            let uploadedPosterType = formData.posterType;

            if (posterFile) {
                const gasUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

                if (!gasUrl) throw new Error('Google Script URL is not configured');

                const base64 = await convertToBase64(posterFile);

                const uploadRes = await fetch(gasUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8',
                    },
                    body: JSON.stringify({
                        filename: posterFile.name,
                        mimeType: posterFile.type,
                        base64: base64
                    })
                });

                if (!uploadRes.ok) throw new Error('Poster upload failed');

                const uploadJson = await uploadRes.json();
                if (!uploadJson.success) throw new Error(uploadJson.error || 'Upload failed');

                uploadedPosterUrl = uploadJson.previewUrl;
                uploadedPosterType = posterFile.type;
            }

            // Use PUT for editing, POST for creating
            const payload = {
                ...formData,
                posterUrl: uploadedPosterUrl,
                posterType: uploadedPosterType
            };

            const res = editingEvent
                ? await apiPut(`/api/events/${editingEvent.id}`, payload)
                : await apiPost('/api/events', payload);

            if (res.ok) {
                setShowForm(false);
                setEditingEvent(null);
                setFormData({
                    title: '', description: '', date: '', fromTime: '', toTime: '',
                    venue: '', room: '', manualVenue: false,
                    category: 'Tech', posterUrl: '', posterType: '', limit: '0',
                    registrationLink: ''
                });
                setPosterFile(null);
                fetchEvents();
                alert(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
            } else {
                const err = await res.json();
                alert(err.error || 'Error saving event');
            }
        } catch (err: any) {
            alert(err.message || 'Error saving event');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            const res = await apiDelete(`/api/events/${id}`);
            if (res.ok) {
                alert('Event deleted successfully!');
                fetchEvents();
            } else {
                const err = await res.json();
                alert(err.error || 'Error deleting event');
            }
        } catch (err) {
            alert('Network error while deleting');
        }
    };

    const handleEdit = (event: any) => {
        setEditingEvent(event);
        setFormData({
            title: event.title || '',
            description: event.description || '',
            date: event.date ? event.date.split('T')[0] : '',
            fromTime: event.fromTime || '',
            toTime: event.toTime || '',
            venue: event.venue || '',
            room: event.room || '',
            manualVenue: !BUILDINGS.includes(event.venue),
            category: event.category || 'Tech',
            posterUrl: event.posterUrl || '',
            posterType: event.posterType || '',
            limit: String(event.limit || '0'),
            registrationLink: event.registrationLink || ''
        });
        setShowForm(true);
    };

    const fetchAttendees = async (id: string) => {
        if (viewingAttendees === id) {
            setViewingAttendees(null);
            return;
        }
        try {
            const res = await apiGet(`/api/events/${id}/attendees`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setAttendees({ ...attendees, [id]: data });
            } else {
                setAttendees({ ...attendees, [id]: [] });
            }
            setViewingAttendees(id);
        } catch (err) { alert(err); }
    };

    if (isLoading) return <div className="container text-center" style={{ paddingTop: '80px' }}>Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <div className="flex justify-between items-center mb-4">
                <h1>Organizer Dashboard</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if (showForm) setEditingEvent(null); }}>
                    {showForm ? 'Cancel' : '+ Create Event'}
                </button>
            </div>

            {showForm && (
                <div className="card glass mb-4 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
                    <h3>{editingEvent ? '✏️ Edit Event' : 'New Event'}</h3>
                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label htmlFor="title">Title</label>
                            <input id="title" className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                        </div>

                        <div className="flex" style={{ gap: '10px' }}>
                            <div className="mb-4" style={{ flex: 1 }}>
                                <label htmlFor="date">Date</label>
                                <input id="date" type="date" className="input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                            </div>
                            <div className="mb-4" style={{ flex: 1 }}>
                                <label htmlFor="fromTime">From Time</label>
                                <input id="fromTime" type="time" className="input" value={formData.fromTime} onChange={e => setFormData({ ...formData, fromTime: e.target.value })} required />
                            </div>
                            <div className="mb-4" style={{ flex: 1 }}>
                                <label htmlFor="toTime">To Time</label>
                                <input id="toTime" type="time" className="input" value={formData.toTime} onChange={e => setFormData({ ...formData, toTime: e.target.value })} required />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center gap-2 mb-2" htmlFor="manualVenue">
                                <input
                                    id="manualVenue"
                                    type="checkbox"
                                    checked={formData.manualVenue}
                                    onChange={e => setFormData({ ...formData, manualVenue: e.target.checked, venue: '' })}
                                />
                                Manually Enter Venue
                            </label>

                            <div className="flex" style={{ gap: '10px' }}>
                                <div style={{ flex: 2 }}>
                                    <label htmlFor="venue">Venue / Building</label>
                                    {formData.manualVenue ? (
                                        <input id="venue" className="input" value={formData.venue || ''} onChange={e => setFormData({ ...formData, venue: e.target.value })} required placeholder="Enter building name" />
                                    ) : (
                                        <select id="venue" className="input" value={formData.venue || ''} onChange={e => setFormData({ ...formData, venue: e.target.value })} required>
                                            <option value="">Select Building</option>
                                            {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="room">Room No</label>
                                    <input id="room" className="input" value={formData.room || ''} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="e.g. 101" />
                                </div>
                            </div>
                        </div>

                        <div className="flex" style={{ gap: '10px' }}>
                            <div className="mb-4" style={{ flex: 1 }}>
                                <label htmlFor="category">Category</label>
                                <select id="category" className="input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>Tech</option>
                                    <option>Cultural</option>
                                    <option>Sports</option>
                                    <option>Workshop</option>
                                    <option>Seminar</option>
                                </select>
                            </div>
                            <div className="mb-4" style={{ flex: 1 }}>
                                <label htmlFor="limit">Registration Limit (0 for unlimited)</label>
                                <input id="limit" type="number" className="input" value={formData.limit} onChange={e => setFormData({ ...formData, limit: e.target.value })} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="description">Description</label>
                            <textarea id="description" className="input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} />
                        </div>

                        <div className="mb-4" style={{ padding: '15px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                            <label htmlFor="poster">Event Poster (PDF or Image, Max 5MB)</label>
                            <input id="poster" type="file" className="input" accept="application/pdf,image/*" onChange={handleFileChange} style={{ border: 'none', padding: '10px 0' }} />
                            {posterFile && <p className="text-muted" style={{ fontSize: '0.9rem' }}>Selected: {posterFile.name}</p>}
                        </div>

                        <div className="mb-4">
                            <label htmlFor="registrationLink">Google Form Registration Link</label>
                            <input id="registrationLink" type="url" className="input" value={formData.registrationLink} onChange={e => setFormData({ ...formData, registrationLink: e.target.value })} placeholder="https://forms.google.com/..." />
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }} disabled={uploading}>
                            {uploading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Publish Event')}
                        </button>
                    </form>
                </div>
            )}

            {events.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: '40px' }}>
                    <h3>No events found.</h3>
                    <p>Create your first event to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-3">
                    {events.map(event => (
                        <div key={event.id} className="card glass">
                            <h3>{event.title}</h3>
                            <p className="text-muted">{format(parseISO(event.date), 'PP')} • {event.fromTime} - {event.toTime}</p>
                            <p>{event.venue} {event.room ? `(${event.room})` : ''}</p>
                            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '8px' }}>Limit: {event.limit === 0 ? 'Unlimited' : event.limit}</p>

                            {event.createdAt && (
                                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                                    Created: {format(new Date(event.createdAt), 'PP p')}
                                </p>
                            )}

                            <div className="flex justify-between mt-4 gap-2">
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                                    onClick={() => router.push(`/organizer/events/${event.id}/attendees`)}
                                >
                                    View Attendees
                                </button>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => handleEdit(event)} title="Edit Event">
                                        Edit
                                    </button>
                                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem', borderColor: 'red', color: 'red' }} onClick={() => handleDelete(event.id)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
