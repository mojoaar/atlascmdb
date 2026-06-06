'use client';

import EntityList from '../EntityList';

const TYPE_LABELS = { functional: 'Functional', hierarchical: 'Hierarchical', matrix: 'Matrix' };
const STATUS_LABELS = { active: 'Active', inactive: 'Inactive' };

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'type', header: 'Type', render: (r) => TYPE_LABELS[r.type] || r.type },
  { key: 'ownerShipScope', header: 'Scope', render: (r) => r.ownershipScope || '-' },
  { key: 'status', header: 'Status', render: (r) => STATUS_LABELS[r.status] || r.status },
  { key: 'roleName', header: 'Role' },
];

export default function TeamsPage() {
  return <EntityList title="Teams" apiPath="/api/teams" detailPath="/portal/teams" columns={columns} searchPlaceholder="Search teams..." />;
}
