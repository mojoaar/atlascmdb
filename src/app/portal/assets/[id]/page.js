'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DetailMenu from '@/components/ui/DetailMenu';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import Field from '@/components/ui/Field';
import { useApi } from '@/lib/useApi';

export default function AssetDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: asset, loading } = useApi(`/api/assets/${id}`);

  if (loading) return <LoadingState />;
  if (!asset) return <div style={{ padding: '2rem', textAlign: 'center' }}>Asset not found</div>;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/portal/assets" onClick={(e) => { e.preventDefault(); router.push('/portal/assets'); }}>&larr; Back to Assets</a>
      </div>
      <div className={styles.detailHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <DetailMenu id={id} entityType="asset" data={asset} />
          <h1 className={styles.detailTitle}>{asset.name}</h1>
        </div>
        <div className={styles.meta}>
          <Badge variant="info">{asset.category}</Badge>
          <Badge variant={asset.status === 'in_use' ? 'success' : asset.status === 'in_stock' ? 'warning' : 'default'}>{asset.status}</Badge>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Details</div>
        <Card>
          <div className={styles.fieldGrid}>
            <Field label="Asset Tag" value={asset.assetTag || '—'} />
            <Field label="Model" value={asset.model || '—'} />
            <Field label="CI" value={asset.ciName || '—'} link={asset.ciId ? `/portal/cis/${asset.ciId}` : null} />
            <Field label="Location" value={asset.locationName || '—'} />
            <Field label="Assigned To" value={asset.assignedToName || '—'} />
            <Field label="Supplier" value={asset.supplier || '—'} />
            <Field label="Purchase Date" value={asset.purchaseDate || '—'} />
            <Field label="Warranty Expiry" value={asset.warrantyExpiry || '—'} />
            <Field label="Cost" value={asset.cost ? `$${Number(asset.cost).toLocaleString()}` : '—'} />
            <Field label="Notes" value={asset.notes || '—'} />
          </div>
        </Card>
      </div>
    </div>
  );
}
