'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';
import { cap } from '@/lib/formatters';

const columns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'rackModel', header: 'Model' },
  { key: 'rackSize', header: 'Size', render: (r) => r.rackSize ? `${r.rackSize}U` : '42U' },
  { key: 'lifecycleStatus', header: 'Status', render: (r) => cap(r.lifecycleStatus) },
  { key: 'locationName', header: 'Location' },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'rackModel', header: 'Model' },
  { key: 'rackSize', header: 'Size', render: (r) => r.rackSize ? `${r.rackSize}U` : '42U' },
  { key: 'description', header: 'Description', default: false },
  { key: 'serialNumber', header: 'Serial #', default: false, sortKey: 'serialNumber' },
  { key: 'lifecycleStatus', header: 'Status', render: (r) => cap(r.lifecycleStatus) },
  { key: 'locationName', header: 'Location' },
  { key: 'environment', header: 'Environment', default: false, render: (r) => cap(r.environment) },
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
  { value: 'rackModel', label: 'Rack Model' },
  { value: 'rackSize', label: 'Rack Size' },
  { value: 'serialNumber', label: 'Serial Number' },
  { value: 'assetTag', label: 'Asset Tag' },
  { value: 'locationName', label: 'Location' },
  { value: 'id', label: 'UUID' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminRacksPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Racks"
      apiPath="/api/cis"
      apiParams="ciType=rack"
      detailPath="/admin/racks"
      columns={columns}
      searchPlaceholder="Search racks..."
      onCreate={() => router.push('/admin/racks/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="racks"
    />
  );
}
