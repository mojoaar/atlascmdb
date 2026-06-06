'use client';

import { useRouter } from 'next/navigation';
import { Server, Layers, Bolt, Users, MapPin } from 'lucide-react';
import AdminEntityList from '../EntityList';

const ICON_MAP = {
  service: Server,
  application: Layers,
  ci: Bolt,
  team: Users,
  location: MapPin,
};

function TypeBadge({ type }) {
  const Icon = ICON_MAP[type];
  if (!Icon) return <span>{type}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Icon size={14} />
      {type}
    </span>
  );
}

const columns = [
  { key: 'sourceType', header: 'Source Type', render: (r) => <TypeBadge type={r.sourceType} /> },
  { key: 'sourceId', header: 'Source ID' },
  { key: 'relationshipType', header: 'Type' },
  { key: 'targetType', header: 'Target Type', render: (r) => <TypeBadge type={r.targetType} /> },
  { key: 'targetId', header: 'Target ID' },
  { key: 'direction', header: 'Direction', render: (r) => r.direction || '—' },
];

const allColumns = [
  { key: 'sourceType', header: 'Source Type', always: true, render: (r) => <TypeBadge type={r.sourceType} /> },
  { key: 'sourceId', header: 'Source ID' },
  { key: 'relationshipType', header: 'Type' },
  { key: 'targetType', header: 'Target Type', render: (r) => <TypeBadge type={r.targetType} /> },
  { key: 'targetId', header: 'Target ID' },
  { key: 'direction', header: 'Direction', render: (r) => r.direction || '—' },
  { key: 'notes', header: 'Notes', default: false },
  { key: 'createdAt', header: 'Created', default: false, render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
  { key: 'updatedAt', header: 'Updated', default: false, render: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—' },
  { key: 'createdByName', header: 'Created By', render: (r) => r.createdByName || '—', default: false },
  { key: 'updatedByName', header: 'Updated By', render: (r) => r.updatedByName || '—', default: false },
];

const filterFields = [
  { value: 'sourceType', label: 'Source Type' },
  { value: 'targetType', label: 'Target Type' },
  { value: 'relationshipType', label: 'Relationship Type' },
  { value: 'direction', label: 'Direction' },
  { value: 'createdByName', label: 'Created By' },
  { value: 'updatedByName', label: 'Updated By' },
];

export default function AdminRelationshipsPage() {
  const router = useRouter();
  return (
    <AdminEntityList
      title="Relationships"
      apiPath="/api/relationships"
      detailPath="/admin/relationships"
      columns={columns}
      searchPlaceholder="Search relationships..."
      onCreate={() => router.push('/admin/relationships/new')}
      filterFields={filterFields}
      allColumns={allColumns}
      columnEntityType="relationships"
    />
  );
}
