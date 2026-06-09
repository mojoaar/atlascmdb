'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';

export default function ImportDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [importSet, setImportSet] = useState(null);

  useEffect(() => {
    fetch(`/api/import-sets/${id}`).then(r => r.json()).then(s => setImportSet(s)).catch(() => {});
  }, [id]);

  if (!importSet) return <LoadingState />;

  const rowColumns = [
    { key: 'rowNumber', header: '#' },
    { key: 'validationStatus', header: 'Status', render: (r) => <Badge variant={r.validationStatus === 'valid' ? 'success' : r.validationStatus === 'error' ? 'danger' : 'default'}>{r.validationStatus}</Badge> },
    { key: 'sourceData', header: 'Source', render: (r) => { try { return JSON.stringify(JSON.parse(r.sourceData)).substring(0, 60); } catch { return String(r.sourceData).substring(0, 60); } } },
    { key: 'destinationRecordId', header: 'Dest. Record', render: (r) => r.destinationRecordId || '—' },
  ];

  const mappingColumns = [
    { key: 'sourceField', header: 'Source Field' },
    { key: 'targetField', header: 'Target Field' },
    { key: 'required', header: 'Required', render: (r) => r.required ? 'Yes' : 'No' },
  ];

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/portal/imports" onClick={(e) => { e.preventDefault(); router.push('/portal/imports'); }}>&larr; Back to Imports</a>
      </div>
      <div className={styles.detailHeader}>
        <h1 className={styles.detailTitle}>{importSet.name}</h1>
        <div className={styles.meta}>
          <Badge variant="info">{importSet.status}</Badge>
          <span>Source: {importSet.sourceType || '—'}</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Mappings</div>
        <Table columns={mappingColumns} data={importSet.mappings || []} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Rows ({importSet.rows?.length || 0})</div>
        <Table columns={rowColumns} data={importSet.rows || []} />
      </div>
    </div>
  );
}
