'use client';

import { useRouter } from 'next/navigation';
import AdminEntityList from '../EntityList';
import { useFormat } from '@/components/auth/AuthProvider';

export default function AdminImportsPage() {
  const router = useRouter();
  const { formatDate } = useFormat();

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'sourceType', header: 'Source' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created', render: (r) => formatDate(r.createdAt) },
  ];
  return (
    <AdminEntityList
      title="Import Sets"
      apiPath="/api/import-sets"
      detailPath="/admin/imports"
      columns={columns}
      searchPlaceholder="Search imports..."
      onCreate={() => router.push('/admin/imports/new')}
    />
  );
}
