'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';

const columns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'ciType', header: 'Class' },
  { key: 'lifecycleStatus', header: 'Status' },
  { key: 'locationName', header: 'Location' },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'ciType', header: 'Class' },
  { key: 'description', header: 'Description', default: false },
  { key: 'serialNumber', header: 'Serial #', default: false, sortKey: 'serialNumber' },
  { key: 'lifecycleStatus', header: 'Status' },
  { key: 'locationName', header: 'Location' },
  { key: 'environment', header: 'Environment', default: false },
  { key: 'classification', header: 'Classification', default: false },
  { key: 'externalRef', header: 'Ext. Ref', default: false },
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
  { value: 'externalRef', label: 'External Ref' },
  { value: 'ciType', label: 'CI Type' },
  { value: 'serialNumber', label: 'Serial Number' },
  { value: 'assetTag', label: 'Asset Tag' },
  { value: 'locationName', label: 'Location' },
  { value: 'id', label: 'UUID' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminCIsPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Configuration Items"
      apiPath="/api/cis"
      detailPath="/admin/cis"
      columns={columns}
      searchPlaceholder="Search CIs..."
      onCreate={() => router.push('/admin/cis/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="cis"
    />
  );
}
