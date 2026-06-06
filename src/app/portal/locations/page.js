'use client';

import EntityList from '../EntityList';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'city', header: 'City' },
  { key: 'type', header: 'Type' },
  { key: 'parentLocationName', header: 'Parent' },
  { key: 'status', header: 'Status' },
];

export default function LocationsPage() {
  return <EntityList title="Locations" apiPath="/api/locations" detailPath="/portal/locations" columns={columns} searchPlaceholder="Search locations..." />;
}
