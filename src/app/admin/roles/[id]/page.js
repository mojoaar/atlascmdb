'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AuditTrail from '@/components/ui/AuditTrail';
import DetailMenu from '@/components/ui/DetailMenu';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { useFeedback } from '@/components/ui/FeedbackProvider';

export default function AdminRoleDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/roles/${id}`).then(r => r.json()).then(role => {
        if (role) setForm({ name: role.name || '', description: role.description || '' });
        setLoading(false);
      });
    }
  }, [id, isNew]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const url = isNew ? '/api/roles' : `/api/roles/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/roles/${data.id}`);
      else { setMessage({ type: 'success', text: 'Role saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  async function handleDelete() {
    if (!await confirm('Delete this role?')) return;
    const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/roles');
    else await alert('Delete failed');
  }

  if (loading) return <LoadingState />;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/admin/roles" onClick={(e) => { e.preventDefault(); router.push('/admin/roles'); }}>&larr; Back to Roles</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {!isNew && <DetailMenu id={id} entityType="role" data={form} />}
          <h1 className={styles.detailTitle}>{isNew ? 'New Role' : form.name}</h1>
        </div>
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
        <div className={styles.sectionTitle}>Role Details</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Name</div><div className={styles.fieldValue}>{form.name || '—'}</div></div>
            ) : (
              <Input label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Description</div><div className={styles.fieldValue}>{form.description || '—'}</div></div>
            ) : (
              <Input label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
            )}
          </div>
        </Card>
      </div>

      {!isNew && viewMode && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Audit Trail</div>
          <Card>
            <AuditTrail entityType="role" entityId={id} />
          </Card>
        </div>
      )}

      {(!isNew && !viewMode) && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          {!isNew && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
        </div>
      )}
    </div>
  );
}
