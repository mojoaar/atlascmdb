'use client';

import EntityList from '../EntityList';
import { cap } from '@/lib/formatters';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'assetTag', header: 'Tag' },
  { key: 'ciName', header: 'CI' },
  { key: 'category', header: 'Category' },
  { key: 'status', header: 'Status', render: (r) => cap(r.status) },
];

export default function PortalAssetsPage() {
  return (
    <EntityList
      title="Assets"
      apiPath="/api/assets"
      detailPath="/portal/assets"
      columns={columns}
      searchPlaceholder="Search assets..."
    />
  );
}
