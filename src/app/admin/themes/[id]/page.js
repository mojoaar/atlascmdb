'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { useFeedback } from '@/components/ui/FeedbackProvider';

export default function AdminThemeDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({ name: '', isDefault: false, isSystem: false, status: 'active', tokenSetLight: '', tokenSetDark: '' });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/themes/${id}`).then(r => r.json()).then(t => {
        if (t) {
          setForm({
            name: t.name || '',
            isDefault: t.isDefault || false,
            isSystem: t.isSystem || false,
            status: t.status || 'active',
            tokenSetLight: t.tokenSetLight ? JSON.stringify(JSON.parse(t.tokenSetLight), null, 2) : '',
            tokenSetDark: t.tokenSetDark ? JSON.stringify(JSON.parse(t.tokenSetDark), null, 2) : '',
          });
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body = {
      name: form.name,
      isDefault: form.isDefault,
      status: form.status,
    };
    if (form.tokenSetLight) {
      try { body.tokenSetLight = JSON.parse(form.tokenSetLight); } catch { setMessage({ type: 'error', text: 'Invalid JSON in Light token set' }); setSaving(false); return; }
    }
    if (form.tokenSetDark) {
      try { body.tokenSetDark = JSON.parse(form.tokenSetDark); } catch { setMessage({ type: 'error', text: 'Invalid JSON in Dark token set' }); setSaving(false); return; }
    }

    const url = isNew ? '/api/themes' : `/api/themes/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/themes/${data.id}`);
      else { setMessage({ type: 'success', text: 'Theme saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  async function handleDelete() {
    if (!await confirm('Delete this theme?')) return;
    const res = await fetch(`/api/themes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) router.push('/admin/themes');
    else await alert(data.error || 'Delete failed');
  }

  if (loading) return <LoadingState />;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/admin/themes" onClick={(e) => { e.preventDefault(); router.push('/admin/themes'); }}>&larr; Back to Themes</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className={styles.detailTitle}>{isNew ? 'New Theme' : form.name}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isNew && viewMode && (
            <Button variant="primary" onClick={() => setViewMode(false)}>Edit</Button>
          )}
          {(!isNew && !viewMode) && (
            <>
              <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              <Button variant="secondary" onClick={() => { setViewMode(true); }}>Cancel</Button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.8125rem',
          background: message.type === 'success' ? 'var(--success)' : 'var(--danger)', color: '#fff' }}>
          {message.text}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Theme Details</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Name</div><div className={styles.fieldValue}>{form.name || '—'}</div></div>
            ) : (
              <Input label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Default Theme</div><div className={styles.fieldValue}>{form.isDefault ? 'Yes' : 'No'}</div></div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <input type="checkbox" checked={form.isDefault} onChange={(e) => update('isDefault', e.target.checked)} />
                Default Theme
              </label>
            )}
            {!isNew && viewMode && (
              <div className={styles.field}><div className={styles.fieldLabel}>System Theme</div><div className={styles.fieldValue}>{form.isSystem ? 'Yes' : 'No'}</div></div>
            )}
            {!isNew && !viewMode && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <input type="checkbox" checked={form.isSystem} onChange={(e) => update('isSystem', e.target.checked)} />
                System Theme
              </label>
            )}
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Light Token Set</div>
                <div className={styles.fieldValue}>
                  <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{form.tokenSetLight || '—'}</pre>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Light Token Set (JSON)</div>
                <textarea
                  value={form.tokenSetLight}
                  onChange={(e) => update('tokenSetLight', e.target.value)}
                  rows={8}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.8125rem', fontFamily: 'monospace', background: 'var(--background)', color: 'var(--foreground)', }}
                />
              </div>
            )}
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Dark Token Set</div>
                <div className={styles.fieldValue}>
                  <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{form.tokenSetDark || '—'}</pre>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Dark Token Set (JSON)</div>
                <textarea
                  value={form.tokenSetDark}
                  onChange={(e) => update('tokenSetDark', e.target.value)}
                  rows={8}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.8125rem', fontFamily: 'monospace', background: 'var(--background)', color: 'var(--foreground)', }}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {(!isNew && !viewMode) && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          {!isNew && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
        </div>
      )}
    </div>
  );
}
