'use client';

import EntityList from '../EntityList';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'vendor', header: 'Vendor' },
  { key: 'version', header: 'Version' },
  { key: 'ownerTeamName', header: 'Team' },
  { key: 'lifecycleStatus', header: 'Status' },
];

export default function AppsPage() {
  return <EntityList title="Applications" apiPath="/api/applications" detailPath="/portal/applications" columns={columns} searchPlaceholder="Search applications..." />;
}
