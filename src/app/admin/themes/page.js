'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'isDefault', header: 'Default', render: (r) => r.isDefault ? 'Yes' : 'No' },
  { key: 'hasLight', header: 'Light', render: (r) => r.tokenSetLight ? 'Yes' : 'No' },
  { key: 'hasDark', header: 'Dark', render: (r) => r.tokenSetDark ? 'Yes' : 'No' },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'isDefault', header: 'Default', render: (r) => r.isDefault ? 'Yes' : 'No' },
  { key: 'hasLight', header: 'Light', render: (r) => r.tokenSetLight ? 'Yes' : 'No' },
  { key: 'hasDark', header: 'Dark', render: (r) => r.tokenSetDark ? 'Yes' : 'No' },
  { key: 'createdByName', header: 'Created By', render: (r) => r.createdByName || '—', default: false },
  { key: 'updatedByName', header: 'Updated By', render: (r) => r.updatedByName || '—', default: false },
];

const filterFields = [
  { value: 'name', label: 'Name' },
  { value: 'isDefault', label: 'Default' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminThemesPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Themes"
      apiPath="/api/themes"
      detailPath="/admin/themes"
      columns={columns}
      searchPlaceholder="Search themes..."
      onCreate={() => router.push('/admin/themes/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="themes"
    />
  );
}
