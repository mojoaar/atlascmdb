'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';
import { cap } from '@/lib/formatters';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'city', header: 'City' },
  { key: 'type', header: 'Type' },
  { key: 'status', header: 'Status', render: (r) => cap(r.status) },
  { key: 'parentLocationName', header: 'Parent' },
];

const allColumns = [
  { key: 'name', header: 'Name', always: true },
  { key: 'city', header: 'City' },
  { key: 'type', header: 'Type' },
  { key: 'status', header: 'Status', render: (r) => cap(r.status) },
  { key: 'parentLocationName', header: 'Parent' },
  { key: 'country', header: 'Country', default: false },
  { key: 'streetAddress', header: 'Street Address', default: false },
  { key: 'postalCode', header: 'Postal Code', default: false },
  { key: 'stateProvince', header: 'State/Province', default: false },
  { key: 'createdAt', header: 'Created', default: false, render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
  { key: 'updatedAt', header: 'Updated', default: false, render: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—' },
  { key: 'createdByName', header: 'Created By', render: (r) => r.createdByName || '—', default: false },
  { key: 'updatedByName', header: 'Updated By', render: (r) => r.updatedByName || '—', default: false },
];

const filterFields = [
  { value: 'name', label: 'Name' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
  { value: 'streetAddress', label: 'Street Address' },
  { value: 'postalCode', label: 'Postal Code' },
  { value: 'stateProvince', label: 'State/Province' },
  { value: 'type', label: 'Type' },
  { value: 'status', label: 'Status' },
  { value: 'parentLocationName', label: 'Parent Location' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminLocationsPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Locations"
      apiPath="/api/locations"
      detailPath="/admin/locations"
      columns={columns}
      searchPlaceholder="Search locations..."
      onCreate={() => router.push('/admin/locations/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="locations"
    />
  );
}
