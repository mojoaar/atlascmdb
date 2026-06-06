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

export default function AppDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: app, loading } = useApi(`/api/applications/${id}`);

  if (loading) return <LoadingState />;
  if (!app) return <div style={{ padding: '2rem', textAlign: 'center' }}>Application not found</div>;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/portal/applications" onClick={(e) => { e.preventDefault(); router.push('/portal/applications'); }}>&larr; Back to Applications</a>
      </div>
      <div className={styles.detailHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <DetailMenu id={id} entityType="application" data={app} />
          <h1 className={styles.detailTitle}>{app.name}</h1>
        </div>
        <div className={styles.meta}>
          <Badge variant="info">{app.lifecycleStatus}</Badge>
          <span>{app.environment}</span>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Details</div>
        <Card>
          <div className={styles.fieldGrid}>
            <Field label="Description" value={app.description || '—'} />
            <Field label="Vendor" value={app.vendor || '—'} />
            <Field label="Version" value={app.version || '—'} />
            <Field label="App Type" value={app.appType || '—'} />
            <Field label="Tech Stack" value={app.technologyStack || '—'} />
            <Field label="Classification" value={app.classification || '—'} />
            <Field label="Owner Team" value={app.ownerTeamName || '—'} />
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Relationships</div>
        <Card>
          <InlineGraph entityType="application" entityId={id} basePath="/portal" />
        </Card>
      </div>
    </div>
  );
}
