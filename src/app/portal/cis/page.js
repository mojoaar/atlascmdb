'use client';

import EntityList from '../EntityList';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'ciType', header: 'Type' },
  { key: 'ownerTeamName', header: 'Team' },
  { key: 'locationName', header: 'Location' },
  { key: 'lifecycleStatus', header: 'Status' },
];

export default function CisPage() {
  return <EntityList title="Configuration Items" apiPath="/api/cis" detailPath="/portal/cis" columns={columns} searchPlaceholder="Search CIs..." />;
}
