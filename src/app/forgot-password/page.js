'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError('Request failed');
    }
    setLoading(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot Password</h1>
        <p className={styles.subtitle}>
          {sent ? 'If the account exists, a reset link has been sent.' : 'Enter your email to receive a reset link.'}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        {!sent && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@atlas.local"
              autoFocus
            />
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
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
