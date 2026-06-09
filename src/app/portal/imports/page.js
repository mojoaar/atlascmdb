'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { useFormat } from '@/components/auth/AuthProvider';
import styles from '@/styles/entity.module.css';

export default function ImportsPage() {
  const router = useRouter();
  const { formatDate } = useFormat();
  const [sets, setSets] = useState([]);

  useEffect(() => {
    fetch('/api/import-sets').then(r => r.json()).then(setSets).catch(() => {});
  }, []);

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'sourceType', header: 'Source' },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'committed' ? 'success' : r.status === 'error' ? 'danger' : 'info'}>{r.status}</Badge> },
    { key: 'createdByName', header: 'Created By' },
    { key: 'createdAt', header: 'Created', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Imports</h1>
      </div>
      <Table columns={columns} data={sets} onRowClick={(r) => router.push(`/portal/imports/${r.id}`)} />
    </div>
  );
}
