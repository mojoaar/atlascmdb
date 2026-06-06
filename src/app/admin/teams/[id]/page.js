'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import AuditTrail from '@/components/ui/AuditTrail';
import DetailMenu from '@/components/ui/DetailMenu';
import HelpIcon from '@/components/ui/HelpIcon';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { unwrap } from '@/lib/unwrap';
import { useFeedback } from '@/components/ui/FeedbackProvider';

const TEAM_TYPE_HELP = [
  'Functional: Teams organized around a specific capability or department (e.g., Platform Engineering, IT Support)',
  'Hierarchical: Traditional top-down structure with clear reporting lines and parent/child teams',
  'Matrix: Cross-functional — members report to both a functional manager and a project lead',
];

const TEAM_TYPE_OPTIONS = [
  { value: 'functional', label: 'Functional' },
  { value: 'hierarchical', label: 'Hierarchical' },
  { value: 'matrix', label: 'Matrix' },
];

const TEAM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminTeamDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({
    name: '', description: '', type: '', parentTeamId: '', parentTeamName: '', ownershipScope: '', status: 'active', roleId: '', roleName: '',
    managerId: '', managerName: '', leadId: '', leadName: '',
  });
  const [members, setMembers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  useEffect(() => {
    fetch('/api/teams?limit=100').then(r => r.json()).then(d => setAllTeams(unwrap(d))).catch(() => {});
    fetch('/api/roles').then(r => r.json()).then(d => setAllRoles(unwrap(d))).catch(() => {});
    fetch('/api/users').then(r => r.json()).then(d => setAllUsers(unwrap(d))).catch(() => {});
    if (!isNew) {
      fetch(`/api/teams/${id}`).then(r => r.json()).then(t => {
        if (t) {
          setForm({
            name: t.name || '',
            description: t.description || '',
            type: t.type || '',
            parentTeamId: t.parentTeamId || '',
            parentTeamName: t.parentTeamName || '',
            ownershipScope: t.ownershipScope || '',
            status: t.status || 'active',
            roleId: t.roleId || '',
            roleName: t.roleName || '',
            managerId: t.managerId || '',
            managerName: t.managerName || '',
            leadId: t.leadId || '',
            leadName: t.leadName || '',
          });
          setMembers(t.members || []);
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body = { ...form };
    if (!body.parentTeamId) body.parentTeamId = null;
    if (!body.roleId) body.roleId = null;
    if (!body.managerId) body.managerId = null;
    if (!body.leadId) body.leadId = null;
    const url = isNew ? '/api/teams' : `/api/teams/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/teams/${data.id}`);
      else { setMessage({ type: 'success', text: 'Team saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  async function handleDelete() {
    if (!await confirm('Delete this team?')) return;
    const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/teams');
    else await alert('Delete failed');
  }

  async function handleAddMember() {
    if (!newMemberUserId) return;
    const res = await fetch(`/api/teams/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newMemberUserId, memberRole: newMemberRole }),
    });
    if (res.ok) {
      const data = await res.json();
      const user = allUsers.find(u => u.id === newMemberUserId);
      setMembers(m => [...m, { membershipId: data.id, memberRole: newMemberRole, id: newMemberUserId, displayName: user?.displayName, email: user?.email }]);
      setNewMemberUserId('');
      setNewMemberRole('');
      setAddMemberOpen(false);
    }
  }

  async function handleRemoveMember(membershipId) {
    if (!await confirm('Remove this member?')) return;
    const res = await fetch(`/api/teams/${id}/members/${membershipId}`, { method: 'DELETE' });
    if (res.ok) setMembers(m => m.filter(m => m.membershipId !== membershipId));
  }

  const teamOptions = [ ...(allTeams || []).filter(t => t.id !== id).map(t => ({ value: t.id, label: t.name }))];
  const roleOptions = [ ...(allRoles || []).map(r => ({ value: r.id, label: r.name }))];
  const userOptions = [ ...(allUsers || []).map(u => ({ value: u.id, label: `${u.displayName} (${u.email})` }))];

  const memberColumns = [
    { key: 'displayName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'memberRole', header: 'Team Role' },
    { key: 'actions', header: '', render: (m) => !viewMode ? <Button variant="danger" size="small" onClick={() => handleRemoveMember(m.membershipId)}>Remove</Button> : null },
  ];

  if (loading) return <LoadingState />;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/admin/teams" onClick={(e) => { e.preventDefault(); router.push('/admin/teams'); }}>&larr; Back to Teams</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {!isNew && <DetailMenu id={id} entityType="team" data={form} />}
            <h1 className={styles.detailTitle}>{isNew ? 'New Team' : form.name}</h1>
          </div>
          {!isNew && <div className={styles.meta}><span>{TEAM_TYPE_OPTIONS.find(o => o.value === form.type)?.label || form.type || 'Team'}</span></div>}
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
        <div className={styles.sectionTitle}>General</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Name</div>
                <div className={styles.fieldValue}>{form.name || '—'}</div>
              </div>
            ) : (
              <Input label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Description</div>
                <div className={styles.fieldValue}>{form.description || '—'}</div>
              </div>
            ) : (
              <Input label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Type <HelpIcon text={TEAM_TYPE_HELP} /></div>
                  <div className={styles.fieldValue}>{TEAM_TYPE_OPTIONS.find(o => o.value === form.type)?.label || form.type || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Type <HelpIcon text={TEAM_TYPE_HELP} /></div>
                  <select value={form.type} onChange={(e) => update('type', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--background)', color: 'var(--foreground)' }}>
                    <option value="">-- Select --</option>
                    {TEAM_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Status</div>
                  <div className={styles.fieldValue}>{TEAM_STATUS_OPTIONS.find(o => o.value === form.status)?.label || form.status || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Select label="Status" options={TEAM_STATUS_OPTIONS} value={form.status} onChange={(e) => update('status', e.target.value)} /></div>
              )}
            </div>
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Parent Team</div>
                <div className={styles.fieldValue}>{teamOptions.find(o => o.value === form.parentTeamId)?.label || form.parentTeamId || '—'}</div>
              </div>
            ) : (
              <Select label="Parent Team" options={teamOptions} value={form.parentTeamId} onChange={(e) => update('parentTeamId', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Ownership Scope</div>
                <div className={styles.fieldValue}>{form.ownershipScope || '—'}</div>
              </div>
            ) : (
              <Input label="Ownership Scope" value={form.ownershipScope} onChange={(e) => update('ownershipScope', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Assigned Role</div>
                <div className={styles.fieldValue}>{roleOptions.find(o => o.value === form.roleId)?.label || form.roleId || '—'}</div>
              </div>
            ) : (
              <Select label="Assigned Role" options={roleOptions} value={form.roleId} onChange={(e) => update('roleId', e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Manager</div>
                  <div className={styles.fieldValue}>{userOptions.find(o => o.value === form.managerId)?.label || form.managerId || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Select label="Manager" options={userOptions} value={form.managerId} onChange={(e) => update('managerId', e.target.value)} /></div>
              )}
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Lead / Product Owner</div>
                  <div className={styles.fieldValue}>{userOptions.find(o => o.value === form.leadId)?.label || form.leadId || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Select label="Lead / Product Owner" options={userOptions} value={form.leadId} onChange={(e) => update('leadId', e.target.value)} /></div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
          <div className={styles.sectionTitle}>
            Members ({members.length})
            {!viewMode && <Button variant="primary" size="small" style={{ marginLeft: '0.75rem' }} onClick={() => setAddMemberOpen(!addMemberOpen)}>+ Add</Button>}
          </div>
          {addMemberOpen && (
            <Card style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Select label="User" options={userOptions} value={newMemberUserId} onChange={(e) => setNewMemberUserId(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <Input label="Role" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} placeholder="member" />
                </div>
                <Button variant="primary" onClick={handleAddMember}>Add</Button>
              </div>
            </Card>
          )}
          <Table columns={memberColumns} data={members} />
        </div>

      {!isNew && viewMode && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Audit Trail</div>
          <Card>
            <AuditTrail entityType="team" entityId={id} />
          </Card>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        {isNew && <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>}
        {!isNew && !viewMode && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
      </div>
    </div>
  );
}
