'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const [activeTab, setActiveTab] = useState('STUDENT'); // STUDENT, ADMIN, STAFF
  const [identifier, setIdentifier] = useState(''); // Email or Register Number based on tab
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            <label htmlFor="identifier" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              {activeTab === 'STUDENT' ? 'Register Number' : 'Email Address'}
            </label>
            <input
              id="identifier"
              type={activeTab === 'STUDENT' ? 'text' : 'email'}
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={activeTab === 'STUDENT' ? 'Enter your register number' : 'Enter your email address'}
              required
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
