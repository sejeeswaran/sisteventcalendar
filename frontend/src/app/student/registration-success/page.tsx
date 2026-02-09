'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistrationSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Show success message
        alert('🎉 Registration Successful! Thank you for registering.');
        // Redirect to home page (student dashboard)
        router.push('/student/dashboard');
    }, [router]);

    return (
        <div className="container pt-20 text-center">
            <div className="card glass max-w-md mx-auto p-8">
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉 Registration Successful!</h1>
                <p className="text-muted mb-4">Thank you for registering. You will be redirected shortly...</p>
                <button className="btn btn-primary" onClick={() => router.push('/student/dashboard')}>
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}
