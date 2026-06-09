'use client';

import EntityList from '../EntityList';
import { cap } from '@/lib/formatters';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'businessServiceId', header: 'Type', render: (r) => r.businessServiceId !== undefined && r.businessServiceId ? 'Business' : 'Technical' },
  { key: 'lifecycleStatus', header: 'Status', render: (r) => cap(r.lifecycleStatus) },
  { key: 'ownerTeamName', header: 'Team' },
  { key: 'environment', header: 'Environment', render: (r) => cap(r.environment) },
];

export default function ServicesPage() {
  return <EntityList title="Services" apiPath="/api/services" detailPath="/portal/services" columns={columns} searchPlaceholder="Search services..." />;
}
