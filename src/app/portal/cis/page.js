'use client';

import EntityList from '../EntityList';
import { cap } from '@/lib/formatters';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'ciType', header: 'Type', render: (r) => {
    const ciTypeLabels = {
      server: 'Server', network_device: 'Network Device',
      storage: 'Storage', database: 'Database',
      container: 'Container', rack: 'Rack', other: 'Other',
    };
    return ciTypeLabels[r.ciType] || r.ciType;
  } },
  { key: 'ownerTeamName', header: 'Team' },
  { key: 'locationName', header: 'Location' },
  { key: 'lifecycleStatus', header: 'Status', render: (r) => cap(r.lifecycleStatus) },
];

export default function CisPage() {
  return     <EntityList title="Configuration Items" apiPath="/api/cis" detailPath={(row) => row.ciType === 'rack' ? `/admin/racks/${row.id}` : `/portal/cis/${row.id}`} columns={columns} searchPlaceholder="Search CIs..." />;
}
