'use client';

import { useState, useEffect, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { useAuth, useFormat } from '@/components/auth/AuthProvider';
import styles from '@/styles/entity.module.css';
import { TIMEZONE_OPTIONS, CLOCK_OPTIONS, DATE_OPTIONS, ROW_LIMIT_OPTIONS, DEPTH_OPTIONS, AVATAR_COLORS } from '@/lib/settings-options';
import { unwrap } from '@/lib/unwrap';

export default function PortalSettingsPage() {
  const { user } = useAuth();
  const { refresh } = useFormat();
  const [themes, setThemes] = useState([]);
  const [currentThemeId, setCurrentThemeId] = useState(null);
  const [timezone, setTimezone] = useState('Europe/Copenhagen');
  const [clockFormat, setClockFormat] = useState('24h');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [graphDepth, setGraphDepth] = useState(3);
  const [rowLimit, setRowLimit] = useState(100);
  const [notifOnCreate, setNotifOnCreate] = useState(true);
  const [notifOnUpdate, setNotifOnUpdate] = useState(true);
  const [notifOnDelete, setNotifOnDelete] = useState(true);
  const [message, setMessage] = useState(null);
  const [avatarBg, setAvatarBg] = useState('#003d7a');
  const [avatarUrl, setAvatarUrl] = useState('');
  const avatarPicked = useRef(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [mfaSecret, setMfaSecret] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaError, setMfaError] = useState(null);

  useEffect(() => {
    fetch('/api/me/theme').then(r => r.json()).then(t => {
      if (t && !t.error) {
        setCurrentThemeId(t.themeId);
        setTimezone(t.timezone || 'Europe/Copenhagen');
        setClockFormat(t.clockFormat || '24h');
        setDateFormat(t.dateFormat || 'DD/MM/YYYY');
        setGraphDepth(t.graphDepth || 3);
        setRowLimit(t.rowLimit || t.adminColumnDefaults?._rowLimit || 100);
        setNotifOnCreate(t.notifOnCreate !== undefined ? !!t.notifOnCreate : true);
        setNotifOnUpdate(t.notifOnUpdate !== undefined ? !!t.notifOnUpdate : true);
        setNotifOnDelete(t.notifOnDelete !== undefined ? !!t.notifOnDelete : true);
      }
    });
    fetch('/api/themes').then(r => r.json()).then(d => setThemes(unwrap(d)));
  }, []);

  useEffect(() => {
    if (user) {
      setMfaEnabled(user.mfaEnabled);
      if (!avatarPicked.current) {
        setAvatarBg(user.avatarBg || '#003d7a');
        setAvatarUrl(user.avatarUrl || '');
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  async function handleSavePrefs() {
    const res = await fetch('/api/me/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        themeId: currentThemeId,
        timezone, clockFormat, dateFormat,
        graphDepth: parseInt(graphDepth),
        rowLimit: parseInt(rowLimit),
        notifOnCreate,
        notifOnUpdate,
        notifOnDelete,
      }),
    });
    if (res.ok) { setMessage({ text: 'Preferences saved', type: 'success' }); refresh(); }
    else setMessage({ text: 'Failed to save', type: 'error' });
  }

  async function handleSelectTheme(themeId) {
    setCurrentThemeId(themeId);
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const tokenSet = isDark ? (theme.tokenSetDark || theme.tokenSetLight) : theme.tokenSetLight;
    if (!tokenSet) return;
    const tokens = typeof tokenSet === 'string' ? JSON.parse(tokenSet) : tokenSet;
    if (tokens.colors) {
      Object.entries(tokens.colors).forEach(([k, v]) => {
        const cssVar = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        document.documentElement.style.setProperty(`--${cssVar}`, v);
      });
    }
    if (tokens.borderRadius) document.documentElement.style.setProperty('--radius', tokens.borderRadius);
    if (tokens.fontFamily) document.documentElement.style.setProperty('--font-family', tokens.fontFamily);
    if (tokens.hover) document.documentElement.style.setProperty('--hover', tokens.hover);
  }

  async function startMfaSetup() {
    const res = await fetch('/api/auth/mfa/setup', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setMfaSecret(data);
      setMfaError(null);
    } else {
      setMfaError('Failed to start MFA setup');
    }
  }

  async function confirmMfa() {
    const res = await fetch('/api/auth/mfa/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: mfaCode }),
    });
    if (res.ok) {
      setMfaEnabled(true);
      setMfaSecret(null);
      setMfaCode('');
      setMfaError(null);
      setMessage({ text: 'MFA enabled', type: 'success' });
    } else {
      const data = await res.json();
      setMfaError(data.error || 'Invalid code');
    }
  }

  async function disableMfa() {
    const res = await fetch('/api/auth/mfa/setup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    if (res.ok) {
      setMfaEnabled(false);
      setMfaSecret(null);
      setMfaCode('');
      setMessage({ text: 'MFA disabled', type: 'success' });
    }
  }

  async function handleAvatarColor(color) {
    avatarPicked.current = true;
    setAvatarBg(color);
    const res = await fetch('/api/users/' + user.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarBg: color }),
    });
    if (res.ok) { setMessage({ text: 'Avatar updated', type: 'success' }); refresh(); }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/users/' + user.id + '/avatar', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      avatarPicked.current = true;
      setAvatarUrl(data.url);
      setMessage({ text: 'Photo uploaded', type: 'success' });
      refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage({ text: err.error || 'Upload failed', type: 'error' });
    }
    setUploading(false);
    e.target.value = '';
  }

  async function handleAvatarRemove() {
    const res = await fetch('/api/users/' + user.id + '/avatar', { method: 'DELETE' });
    if (res.ok) {
      avatarPicked.current = true;
      setAvatarUrl('');
      setMessage({ text: 'Photo removed', type: 'success' });
      refresh();
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title} style={{ marginBottom: '1.5rem' }}>User Settings</h1>

      {message && (
        <div style={{ background: `color-mix(in srgb, var(--${message.type === 'error' ? 'danger' : 'success'}) 10%, transparent)`, color: `var(--${message.type === 'error' ? 'danger' : 'success'})`, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{message.text}</div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Profile</div>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Avatar user={{ ...user, avatarBg, avatarUrl }} size={64} />
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{user?.displayName}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{user?.email}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} />
                <Button variant="secondary" size="small" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? 'Uploading...' : 'Upload photo'}
                </Button>
                {avatarUrl && (
                  <Button variant="danger" size="small" onClick={handleAvatarRemove}>
                    Remove photo
                  </Button>
                )}
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => handleAvatarColor(c)}
                    style={{
                      width: 20, height: 20, borderRadius: '50%', border: avatarBg === c ? '2px solid var(--foreground)' : '2px solid transparent',
                      background: c, cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Theme</div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                style={{
                  padding: '0.75rem',
                  border: currentThemeId === t.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--card-foreground)' }}>{t.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Light &amp; Dark</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <Button variant="secondary" size="small" onClick={handleSavePrefs}>Save Preference</Button>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Multi-Factor Authentication</div>
        <Card>
          {mfaEnabled ? (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
                MFA is enabled on your account.
              </p>
              <Button variant="danger" size="small" onClick={disableMfa}>Disable MFA</Button>
            </div>
          ) : mfaSecret ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Scan this QR code with your authenticator app:</div>
                <div style={{ background: '#fff', padding: '0.5rem', borderRadius: 'var(--radius)', display: 'inline-block' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(mfaSecret.otpauthUrl)}`}
                    alt="QR code"
                    style={{ display: 'block', width: 160, height: 160 }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.5rem', wordBreak: 'break-all', maxWidth: 320 }}>
                  Secret: {mfaSecret.secret}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ maxWidth: 160 }}>
                  <Input
                    label="Verification code"
                    type="text"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value)}
                    placeholder="123456"
                    autoFocus
                  />
                </div>
                <Button size="small" onClick={confirmMfa} disabled={!mfaCode}>Confirm</Button>
              </div>
              {mfaError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{mfaError}</div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
                Protect your account with two-factor authentication.
              </p>
              <Button variant="secondary" size="small" onClick={startMfaSetup}>Set Up MFA</Button>
            </div>
          )}
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Locale</div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
            <Select label="Timezone" options={TIMEZONE_OPTIONS} value={timezone} onChange={e => setTimezone(e.target.value)} />
            <Select label="Clock Format" options={CLOCK_OPTIONS} value={clockFormat} onChange={e => setClockFormat(e.target.value)} />
            <Select label="Date Format" options={DATE_OPTIONS} value={dateFormat} onChange={e => setDateFormat(e.target.value)} />
            <Select label="Graph Depth" options={DEPTH_OPTIONS} value={String(graphDepth)} onChange={e => setGraphDepth(e.target.value)} />
            <Select label="Rows Per Page" options={ROW_LIMIT_OPTIONS} value={String(rowLimit)} onChange={e => setRowLimit(Number(e.target.value))} />
          </div>
          <Button variant="secondary" size="small" onClick={handleSavePrefs}>Save Preferences</Button>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Notifications</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
              Configure which actions on managed items (services, CIs, assets, or applications) you own trigger notifications for you.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifOnCreate}
                  onChange={(e) => setNotifOnCreate(e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--card-foreground)' }}>Item Created</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Receive a notification when a new item you own is created</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifOnUpdate}
                  onChange={(e) => setNotifOnUpdate(e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--card-foreground)' }}>Item Updated</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Receive a notification when an item you own is modified</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifOnDelete}
                  onChange={(e) => setNotifOnDelete(e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--card-foreground)' }}>Item Deleted</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Receive a notification when an item you own is deleted</div>
                </div>
              </label>
            </div>
          </div>
          <Button variant="secondary" size="small" onClick={handleSavePrefs}>Save Preferences</Button>
        </Card>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Credits</div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <Credit name="Next.js" url="https://nextjs.org" />
            <Credit name="React" url="https://react.dev" />
            <Credit name="Knex.js" url="https://knexjs.org" />
            <Credit name="better-sqlite3" url="https://github.com/WiseLibs/better-sqlite3" />
            <Credit name="@xyflow/react" url="https://reactflow.dev" />
            <Credit name="@dagrejs/dagre" url="https://github.com/dagrejs/dagre" />
            <Credit name="recharts" url="https://recharts.org" />
            <Credit name="react-leaflet" url="https://react-leaflet.js.org" />
            <Credit name="Leaflet" url="https://leafletjs.com" />
            <Credit name="OpenStreetMap" url="https://www.openstreetmap.org/about" />
            <Credit name="lucide-react" url="https://lucide.dev" />
            <Credit name="openid-client" url="https://github.com/panva/openid-client" />
            <Credit name="jsonwebtoken" url="https://github.com/auth0/node-jsonwebtoken" />
            <Credit name="otpauth" url="https://github.com/hectorm/otpauth" />
            <Credit name="bcryptjs" url="https://github.com/dcodeIO/bcrypt.js" />
            <Credit name="uuid" url="https://github.com/uuidjs/uuid" />
            <Credit name="Prism.js" url="https://prismjs.com" />
            <Credit name="Catppuccin" url="https://catppuccin.com" />
            <Credit name="Nord" url="https://www.nordtheme.com" />
            <Credit name="Dracula" url="https://draculatheme.com" />
            <Credit name="Cyberpunk" url="https://www.media.io/color-palette/cyberpunk-color-palette.html" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Credit({ name, url }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--foreground)', textDecoration: 'none', padding: '0.25rem 0' }}>
      {name}
    </a>
  );
}
