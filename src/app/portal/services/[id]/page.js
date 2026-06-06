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

export default function ServiceDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: service, loading } = useApi(`/api/services/${id}`);

  if (loading) return <LoadingState />;
  if (!service) return <div style={{ padding: '2rem', textAlign: 'center' }}>Service not found</div>;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/portal/services" onClick={(e) => { e.preventDefault(); router.push('/portal/services'); }}>&larr; Back to Services</a>
      </div>
      <div className={styles.detailHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <DetailMenu id={id} entityType="service" data={service} />
          <h1 className={styles.detailTitle}>{service.name}</h1>
        </div>
        <div className={styles.meta}>
          <Badge variant="info">{service.type}</Badge>
          <Badge variant={service.lifecycleStatus === 'production' ? 'success' : 'default'}>{service.lifecycleStatus}</Badge>
          <span>{service.environment}</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Details</div>
        <Card>
          <div className={styles.fieldGrid}>
            <Field label="Description" value={service.description || '—'} />
            <Field label="Classification" value={service.classification || '—'} />
            <Field label="Environment" value={service.environment || '—'} />
            <Field label="Lifecycle Status" value={service.lifecycleStatus || '—'} />
            <Field label="Owner Team" value={service.ownerTeamName || '—'} />
            {service.type === 'business' && (
              <>
                <Field label="Business Criticality" value={service.typeSpecific?.businessCriticality || '—'} />
                <Field label="Business Owner" value={service.typeSpecific?.businessOwner || '—'} />
                <Field label="Service Tier" value={service.typeSpecific?.serviceTier || '—'} />
              </>
            )}
            {service.type === 'technical' && (
              <>
                <Field label="Support Model" value={service.typeSpecific?.supportModel || '—'} />
                <Field label="Service Category" value={service.typeSpecific?.serviceCategory || '—'} />
              </>
            )}
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Relationships</div>
        <Card>
          <InlineGraph entityType="service" entityId={id} basePath="/portal" />
        </Card>
      </div>
    </div>
  );
}
