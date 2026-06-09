'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';
import { cap } from '@/lib/formatters';

const columns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'assetTag', header: 'Tag' },
  { key: 'ciName', header: 'CI' },
  { key: 'category', header: 'Category' },
  { key: 'status', header: 'Status', render: (r) => cap(r.status) },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'assetTag', header: 'Tag' },
  { key: 'ciName', header: 'CI' },
  { key: 'category', header: 'Category' },
  { key: 'model', header: 'Model', default: false },
  { key: 'status', header: 'Status', render: (r) => cap(r.status) },
  { key: 'locationName', header: 'Location', default: false },
  { key: 'assignedToName', header: 'Assigned To', default: false },
  { key: 'supplier', header: 'Supplier', default: false },
  { key: 'purchaseDate', header: 'Purchased', default: false, render: (r) => r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString() : '—' },
  { key: 'createdAt', header: 'Created', default: false, render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
  { key: 'updatedAt', header: 'Updated', default: false, render: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—' },
  { key: 'createdByName', header: 'Created By', render: (r) => r.createdByName || '—', default: false },
  { key: 'updatedByName', header: 'Updated By', render: (r) => r.updatedByName || '—', default: false },
];

const filterFields = [
  { value: 'name', label: 'Name' },
  { value: 'assetTag', label: 'Asset Tag' },
  { value: 'category', label: 'Category' },
  { value: 'model', label: 'Model' },
  { value: 'status', label: 'Status' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'ciName', label: 'CI Name' },
  { value: 'locationName', label: 'Location' },
  { value: 'assignedToName', label: 'Assigned To' },
  { value: 'id', label: 'UUID' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminAssetsPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Assets"
      apiPath="/api/assets"
      detailPath="/admin/assets"
      columns={columns}
      searchPlaceholder="Search assets..."
      onCreate={() => router.push('/admin/assets/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="assets"
    />
  );
}
