'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from '../forgot-password/page.module.css';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Reset failed');
      }
    } catch {
      setError('Request failed');
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Invalid Reset Link</h1>
          <p className={styles.subtitle}>The reset link is invalid or missing a token.</p>
          <div style={{ textAlign: 'center' }}>
            <a href="/login" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Back to login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>{success ? 'Password reset successfully.' : 'Choose a new password.'}</p>

        {success && <div className={styles.success} style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', color: 'var(--success)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1rem', textAlign: 'center' }}>Password reset successfully.</div>}
        {error && <div style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              autoFocus
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
            />
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/login" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Back to login</a>
        </div>
      </div>
    </div>
  );
}
