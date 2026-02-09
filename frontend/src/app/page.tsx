'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const [activeTab, setActiveTab] = useState('STUDENT'); // STUDENT, ADMIN, STAFF
  const [identifier, setIdentifier] = useState(''); // Email or Register Number based on tab
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare payload based on role
      const payload: any = { password, role: activeTab };
      if (activeTab === 'STUDENT') {
        payload.registerNumber = identifier;
      } else {
        payload.email = identifier;
      }

      const res = await apiPost('/api/auth/login', payload);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-between" style={{ minHeight: '80vh', justifyContent: 'center' }}>
      <div className="card glass" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
        <h2 className="text-center" style={{ marginBottom: '24px', fontWeight: 'bold' }}>Welcome Back</h2>

        <div className="flex justify-between" style={{ marginBottom: '20px', gap: '10px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('STUDENT'); setIdentifier(''); setError(''); }}
            className={`btn ${activeTab === 'STUDENT' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('STAFF'); setIdentifier(''); setError(''); }}
            className={`btn ${activeTab === 'STAFF' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('ADMIN'); setIdentifier(''); setError(''); }}
            className={`btn ${activeTab === 'ADMIN' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
          >
            Admin
          </button>
        </div>

        {error && <div style={{ background: 'rgba(128, 0, 32, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              {activeTab === 'STUDENT' ? 'Register Number' : 'Email Address'}
            </label>
            <input
              type={activeTab === 'STUDENT' ? 'text' : 'email'}
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={activeTab === 'STUDENT' ? 'Enter your register number' : 'Enter your email address'}
              required
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4 text-muted" style={{ fontSize: '0.9rem' }}>
          Don't have an account? <Link href="/signup" style={{ color: 'var(--primary)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
