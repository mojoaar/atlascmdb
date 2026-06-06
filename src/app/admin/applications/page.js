'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';

const columns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'applicationType', header: 'Type', sortKey: 'appType' },
  { key: 'lifecycleStatus', header: 'Status' },
  { key: 'ownerTeamName', header: 'Team' },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'applicationType', header: 'Type', sortKey: 'appType' },
  { key: 'description', header: 'Description', default: false },
  { key: 'vendor', header: 'Vendor', default: false },
  { key: 'version', header: 'Version', default: false },
  { key: 'lifecycleStatus', header: 'Status' },
  { key: 'ownerTeamName', header: 'Team' },
  { key: 'environment', header: 'Environment', default: false },
  { key: 'classification', header: 'Classification', default: false },
  { key: 'createdAt', header: 'Created', default: false, render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
  { key: 'updatedAt', header: 'Updated', default: false, render: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—' },
  { key: 'createdByName', header: 'Created By', render: (r) => r.createdByName || '—', default: false },
  { key: 'updatedByName', header: 'Updated By', render: (r) => r.updatedByName || '—', default: false },
];

const filterFields = [
  { value: 'name', label: 'Name' },
  { value: 'description', label: 'Description' },
  { value: 'lifecycleStatus', label: 'Status' },
  { value: 'environment', label: 'Environment' },
  { value: 'classification', label: 'Classification' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'version', label: 'Version' },
  { value: 'appType', label: 'App Type' },
  { value: 'technologyStack', label: 'Technology Stack' },
  { value: 'ownerTeamName', label: 'Team' },
  { value: 'id', label: 'UUID' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminApplicationsPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Applications"
      apiPath="/api/applications"
      detailPath="/admin/applications"
      columns={columns}
      searchPlaceholder="Search applications..."
      onCreate={() => router.push('/admin/applications/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="applications"
    />
  );
}
