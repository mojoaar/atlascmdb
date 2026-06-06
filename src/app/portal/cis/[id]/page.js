'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import InlineGraph from '@/components/graph/InlineGraph';
import DetailMenu from '@/components/ui/DetailMenu';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import Field from '@/components/ui/Field';
import { useApi } from '@/lib/useApi';

export default function CiDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: ci, loading } = useApi(`/api/cis/${id}`);

  if (loading) return <LoadingState />;
  if (!ci) return <div style={{ padding: '2rem', textAlign: 'center' }}>CI not found</div>;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/portal/cis" onClick={(e) => { e.preventDefault(); router.push('/portal/cis'); }}>&larr; Back to CIs</a>
      </div>
      <div className={styles.detailHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <DetailMenu id={id} entityType="ci" data={ci} />
          <h1 className={styles.detailTitle}>{ci.name}</h1>
        </div>
        <div className={styles.meta}>
          <Badge variant="info">{ci.ciType}</Badge>
          <Badge variant={ci.lifecycleStatus === 'production' ? 'success' : 'default'}>{ci.lifecycleStatus}</Badge>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Details</div>
        <Card>
          <div className={styles.fieldGrid}>
            <Field label="Description" value={ci.description || '—'} />
            <Field label="Serial Number" value={ci.serialNumber || '—'} />
            <Field label="Asset Tag" value={ci.assetTag || '—'} />
            <Field label="External Ref" value={ci.externalRef || '—'} />
            <Field label="Classification" value={ci.classification || '—'} />
            <Field label="Environment" value={ci.environment || '—'} />
            <Field label="Owner Team" value={ci.ownerTeamName || '—'} />
            <Field label="Location" value={ci.locationName || '—'} />
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Relationships</div>
        <Card>
          <InlineGraph entityType="ci" entityId={id} basePath="/portal" />
        </Card>
      </div>
    </div>
  );
}
