'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import AuditTrail from '@/components/ui/AuditTrail';
import DetailMenu from '@/components/ui/DetailMenu';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { unwrap } from '@/lib/unwrap';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import OrgChartViewer from '@/components/graph/OrgChartViewer';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'pending', label: 'Pending' },
];

export default function AdminUserDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({
    email: '', displayName: '', password: '', status: 'active', roleIds: [], managerId: '', managerName: '',
  });
  const [allRoles, setAllRoles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);

  async function handleImpersonate() {
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    });
    if (res.ok) {
      window.location.href = '/portal';
    } else {
      const data = await res.json();
      await alert(data.error || 'Failed to impersonate');
    }
  }

  useEffect(() => {
    fetch('/api/roles').then(r => r.json()).then(d => setAllRoles(unwrap(d))).catch(() => {});
    fetch('/api/users').then(r => r.json()).then(d => setAllUsers(unwrap(d))).catch(() => {});
    if (!isNew) {
      fetch(`/api/users/${id}`).then(r => r.json()).then(u => {
        if (u) {
          setForm({
            email: u.email || '',
            displayName: u.displayName || '',
            password: '',
            status: u.status || 'active',
            roleIds: (u.roles || []).map(r => r.id),
            managerId: u.managerId || '',
            managerName: u.managerName || '',
          });
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  function toggleRole(roleId) {
    setForm(f => ({
      ...f,
      roleIds: f.roleIds.includes(roleId)
        ? f.roleIds.filter(r => r !== roleId)
        : [...f.roleIds, roleId],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body = {
      email: form.email,
      displayName: form.displayName,
      status: form.status,
      roleIds: form.roleIds,
      managerId: form.managerId || null,
    };
    if (form.password) body.password = form.password;
    if (isNew) {
      if (!form.password) {
        setMessage({ type: 'error', text: 'Password is required for new users' });
        setSaving(false);
        return;
      }
    }

    const url = isNew ? '/api/users' : `/api/users/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/users/${data.id}`);
      else { setMessage({ type: 'success', text: 'User saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  async function handleDelete() {
    if (!await confirm('Disable this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/users');
    else await alert('Delete failed');
  }

  if (loading) return <LoadingState />;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/admin/users" onClick={(e) => { e.preventDefault(); router.push('/admin/users'); }}>&larr; Back to Users</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {!isNew && <DetailMenu id={id} entityType="user" data={form} />}
          <h1 className={styles.detailTitle}>{isNew ? 'New User' : form.displayName}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isNew && (
            <Button variant="secondary" onClick={handleImpersonate}>Impersonate</Button>
          )}
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
        <div className={styles.sectionTitle}>User Details</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Display Name</div><div className={styles.fieldValue}>{form.displayName || '—'}</div></div>
            ) : (
              <Input label="Display Name" value={form.displayName} onChange={(e) => update('displayName', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Email</div><div className={styles.fieldValue}>{form.email || '—'}</div></div>
            ) : (
              <Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            )}
            {!viewMode && (
              <Input label={isNew ? 'Password' : 'New Password (leave blank to keep)'} type="password" value={form.password} onChange={(e) => update('password', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Status</div><div className={styles.fieldValue}>{STATUS_OPTIONS.find(o => o.value === form.status)?.label || form.status || '—'}</div></div>
            ) : (
              <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => update('status', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Manager</div><div className={styles.fieldValue}>{(allUsers || []).find(u => u.id === form.managerId)?.displayName || (allUsers || []).find(u => u.id === form.managerId)?.email || form.managerId || '—'}</div></div>
            ) : (
              <Select
                label="Manager"
                options={(allUsers || []).filter(u => u.id !== id).map(u => ({ value: u.id, label: u.displayName || u.email }))}
                value={form.managerId}
                onChange={(e) => update('managerId', e.target.value)}
              />
            )}
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Roles</div>
        <Card>
          {viewMode ? (
            <div style={{ fontSize: '0.8125rem' }}>
              {(allRoles || []).filter(role => form.roleIds.includes(role.id)).map(role => role.name).join(', ') || <span style={{ color: 'var(--muted-foreground)' }}>None</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(allRoles || []).map(role => (
                <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.roleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  {role.name}
                </label>
              ))}
              {(!allRoles || allRoles.length === 0) && <span style={{ color: 'var(--muted-foreground)' }}>No roles available</span>}
            </div>
          )}
        </Card>
      </div>

      {!isNew && viewMode && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Organisation</div>
          <OrgChartViewer userId={id} />
        </div>
      )}

      {!isNew && viewMode && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Audit Trail</div>
          <Card>
            <AuditTrail entityType="user" entityId={id} />
          </Card>
        </div>
      )}

      {(!isNew && !viewMode) && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          {!isNew && <Button variant="danger" onClick={handleDelete}>Disable</Button>}
        </div>
      )}
    </div>
  );
}
