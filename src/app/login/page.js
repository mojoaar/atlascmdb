'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

const ASCII_LOGO = [
  "    _   _   _           ",
  "   / \\ | |_| | __ _ ___ ",
  "  / _ \\| __| |/ _` / __|",
  " / ___ \\ |_| | (_| \\__ \\",
  "/_/   \\_\\__|_|\\__,_|___/"
].join('\n');

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [useAsciiLogo, setUseAsciiLogo] = useState(false);

  useEffect(() => {
    fetch('/api/config/public')
      .then(res => res.json())
      .then(data => {
        if (data && data.login_ascii_logo === 'true') {
          setUseAsciiLogo(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = mfaRequired
        ? { mfaToken, code: mfaCode }
        : { email, password };

      const endpoint = mfaRequired ? '/api/auth/mfa/verify' : '/api/auth/login';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.mfaRequired) {
        setMfaToken(data.mfaToken);
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      localStorage.setItem('atlas_access', data.accessToken);
      localStorage.setItem('atlas_refresh', data.refreshToken);

      const meRes = await fetch('/api/auth/me');
      const me = await meRes.json();

      if (me.roles?.includes('admin')) {
        router.push('/admin/dashboard');
      } else {
        router.push('/portal');
      }
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {useAsciiLogo ? (
          <pre className={styles.asciiLogo}>{ASCII_LOGO}</pre>
        ) : (
          <h1 className={styles.title}>Atlas</h1>
        )}
        <p className={styles.subtitle}>
          {mfaRequired ? 'Enter your MFA code' : 'Sign in to your account'}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {mfaRequired ? (
            <Input
              label="MFA Code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="000000"
              autoFocus
            />
          ) : (
            <>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@atlas.local"
                autoFocus
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </>
          )}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : mfaRequired ? 'Verify' : 'Sign in'}
          </Button>
        </form>

        {!mfaRequired && (
          <div className={styles.links}>
            <a href="/forgot-password">Forgot password?</a>
          </div>
        )}
      </div>
    </div>
  );
}
