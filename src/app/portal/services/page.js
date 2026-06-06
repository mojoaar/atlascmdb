'use client';

import EntityList from '../EntityList';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'businessServiceId', header: 'Type', render: (r) => r.businessServiceId !== undefined && r.businessServiceId ? 'Business' : 'Technical' },
  { key: 'lifecycleStatus', header: 'Status' },
  { key: 'ownerTeamName', header: 'Team' },
  { key: 'environment', header: 'Environment' },
];

export default function ServicesPage() {
  return <EntityList title="Services" apiPath="/api/services" detailPath="/portal/services" columns={columns} searchPlaceholder="Search services..." />;
}
