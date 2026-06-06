'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';

const TYPE_LABELS = { functional: 'Functional', hierarchical: 'Hierarchical', matrix: 'Matrix' };
const STATUS_LABELS = { active: 'Active', inactive: 'Inactive' };

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'type', header: 'Type', render: (r) => TYPE_LABELS[r.type] || r.type },
  { key: 'status', header: 'Status', render: (r) => STATUS_LABELS[r.status] || r.status },
  { key: 'managerName', header: 'Manager', render: (r) => r.managerName || '—' },
  { key: 'leadName', header: 'Lead', render: (r) => r.leadName || '—' },
  { key: 'roleName', header: 'Assigned Role' },
];

const filterFields = [
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'status', label: 'Status' },
  { value: 'roleName', label: 'Role' },
  { value: 'parentTeamName', label: 'Parent Team' },
  { value: 'managerName', label: 'Manager' },
  { value: 'leadName', label: 'Lead' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'type', header: 'Type', render: (r) => TYPE_LABELS[r.type] || r.type },
  { key: 'status', header: 'Status', render: (r) => STATUS_LABELS[r.status] || r.status },
  { key: 'managerName', header: 'Manager', render: (r) => r.managerName || '—', default: false },
  { key: 'leadName', header: 'Lead', render: (r) => r.leadName || '—', default: false },
  { key: 'roleName', header: 'Assigned Role' },
  { key: 'parentTeamName', header: 'Parent Team', render: (r) => r.parentTeamName || '—' },
  { key: 'description', header: 'Description', default: false },
  { key: 'createdAt', header: 'Created', default: false, render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
  { key: 'updatedAt', header: 'Updated', default: false, render: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—' },
  { key: 'createdByName', header: 'Created By', render: (r) => r.createdByName || '—', default: false },
  { key: 'updatedByName', header: 'Updated By', render: (r) => r.updatedByName || '—', default: false },
];

export default function AdminTeamsPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Teams"
      apiPath="/api/teams"
      detailPath="/admin/teams"
      columns={columns}
      searchPlaceholder="Search teams..."
      onCreate={() => router.push('/admin/teams/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="teams"
    />
  );
}
