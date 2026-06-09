'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';
import { cap } from '@/lib/formatters';

const columns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'businessServiceId', header: 'Type', sortable: false, render: (r) => r.businessServiceId !== undefined && r.businessServiceId ? 'Business' : 'Technical' },
  { key: 'lifecycleStatus', header: 'Status', render: (r) => cap(r.lifecycleStatus) },
  { key: 'ownerTeamName', header: 'Team' },
  { key: 'environment', header: 'Environment', render: (r) => cap(r.environment) },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'businessServiceId', header: 'Type', sortable: false, render: (r) => r.businessServiceId !== undefined && r.businessServiceId ? 'Business' : 'Technical' },
  { key: 'description', header: 'Description', default: false },
  { key: 'lifecycleStatus', header: 'Status', render: (r) => cap(r.lifecycleStatus) },
  { key: 'ownerTeamName', header: 'Team' },
  { key: 'environment', header: 'Environment', render: (r) => cap(r.environment) },
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
  { value: 'ownerTeamName', label: 'Team' },
  { value: 'id', label: 'UUID' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminServicesPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Services"
      apiPath="/api/services"
      detailPath="/admin/services"
      columns={columns}
      searchPlaceholder="Search services..."
      onCreate={() => router.push('/admin/services/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="services"
    />
  );
}
