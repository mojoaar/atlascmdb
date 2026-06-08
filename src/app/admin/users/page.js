'use client';

import { useRouter } from 'next/navigation';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import AdminEntityList from '../EntityList';

const STATUS_LABELS = { active: 'Active', inactive: 'Inactive', suspended: 'Suspended', disabled: 'Disabled' };

const allColumns = [
  { key: 'displayName', header: 'Name', always: true },
  { key: 'email', header: 'Email' },
  { key: 'managerName', header: 'Manager', render: (r) => r.managerName || '—' },
  { key: 'status', header: 'Status', render: (r) => STATUS_LABELS[r.status] || r.status || '—' },
  { key: 'roleNames', header: 'Roles', sortable: false, render: (r) => (r.roleNames || []).join(', ') || '—' },
  { key: 'disabled', header: 'Disabled', default: false, render: (r) => r.status === 'disabled' ? 'Yes' : 'No' },
  { key: 'mfaEnabled', header: 'MFA', default: false, render: (r) => r.mfaEnabled ? 'Yes' : 'No' },
  { key: 'createdAt', header: 'Created', default: false, render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
  { key: 'updatedAt', header: 'Updated', default: false, render: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—' },
  { key: 'createdByName', header: 'Created By', render: (r) => r.createdByName || '—', default: false },
  { key: 'updatedByName', header: 'Updated By', render: (r) => r.updatedByName || '—', default: false },
];

const filterFields = [
  { value: 'displayName', label: 'Display Name' },
  { value: 'email', label: 'Email' },
  { value: 'managerName', label: 'Manager' },
  { value: 'roleName', label: 'Role' },
  { value: 'status', label: 'Status' },
  { value: 'mfaEnabled', label: 'MFA Enabled' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { alert, confirm } = useFeedback();

  async function handleImpersonate(userId) {
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      window.location.href = '/portal';
    } else {
      const data = await res.json();
      await alert(data.error || 'Failed to impersonate');
    }
  }

  async function handleDisable(userId) {
    if (!await confirm('Disable this user?')) return;
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json();
      await alert(data.error || 'Failed to disable user');
    }
  }

  const columns = [
    { key: 'displayName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'managerName', header: 'Manager', render: (r) => r.managerName || '—' },
    { key: 'status', header: 'Status', render: (r) => STATUS_LABELS[r.status] || r.status || '—' },
    { key: 'roleNames', header: 'Roles', sortable: false, render: (r) => (r.roleNames || []).join(', ') || '—' },
    { key: 'actions', header: '', sortable: false, width: 170, render: (r) => (
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <button
          onClick={(e) => { e.stopPropagation(); handleImpersonate(r.id); }}
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', background: 'var(--warning)', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          Impersonate
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDisable(r.id); }}
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          Disable
        </button>
      </div>
    )},
  ];

  return (
    <AdminEntityList
      title="Users"
      apiPath="/api/users"
      detailPath="/admin/users"
      columns={columns}
      searchPlaceholder="Search users..."
      onCreate={() => router.push('/admin/users/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="users"
      bulkEntityType="users"
    />
  );
}
