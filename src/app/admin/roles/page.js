'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'description', header: 'Description', render: (r) => r.description || '—' },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'description', header: 'Description', render: (r) => r.description || '—' },
  { key: 'createdByName', header: 'Created By', render: (r) => r.createdByName || '—', default: false },
  { key: 'updatedByName', header: 'Updated By', render: (r) => r.updatedByName || '—', default: false },
];

const filterFields = [
  { value: 'name', label: 'Name' },
  { value: 'description', label: 'Description' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminRolesPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Roles"
      apiPath="/api/roles"
      detailPath="/admin/roles"
      columns={columns}
      searchPlaceholder="Search roles..."
      onCreate={() => router.push('/admin/roles/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="roles"
    />
  );
}
