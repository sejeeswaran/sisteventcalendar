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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ paddingRight: '50px', marginBottom: 0 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px'
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                    <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                    <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
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
