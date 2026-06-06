'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import MapViewer from '@/components/graph/MapViewer';
import DetailMenu from '@/components/ui/DetailMenu';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import Field from '@/components/ui/Field';
import { useApi } from '@/lib/useApi';

export default function LocationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: location, loading } = useApi(`/api/locations/${id}`);

  if (loading) return <LoadingState />;
  if (!location) return <div style={{ padding: '2rem', textAlign: 'center' }}>Location not found</div>;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/portal/locations" onClick={(e) => { e.preventDefault(); router.push('/portal/locations'); }}>&larr; Back to Locations</a>
      </div>
      <div className={styles.detailHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <DetailMenu id={id} entityType="location" data={location} />
          <h1 className={styles.detailTitle}>{location.name}</h1>
        </div>
        <div className={styles.meta}>
          <span>Type: {location.type}</span>
          <span>Status: {location.status}</span>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Details</div>
        <Card>
          <div className={styles.fieldGrid}>
            <Field label="Description" value={location.description || '—'} />
            <Field label="Type" value={location.type || '—'} />
            <Field label="Parent" value={location.parentLocationName || '—'} />
            <Field label="Status" value={location.status || '—'} />
          </div>
        </Card>
      </div>
      {(location.streetAddress || location.city) && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Address</div>
          <Card>
            <div className={styles.fieldGrid}>
              <Field label="Street" value={location.streetAddress || '—'} />
              <Field label="Postal Code" value={location.postalCode || '—'} />
              <Field label="City" value={location.city || '—'} />
              <Field label="State/Province" value={location.stateProvince || '—'} />
              <Field label="Country" value={location.country || '—'} />
            </div>
          </Card>
        </div>
      )}
      {location.children?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Child Locations</div>
          <Card>
            {location.children.map(c => (
              <div key={c.id} style={{ padding: '0.25rem 0', fontSize: '0.875rem' }}>
                <a href={`/portal/locations/${c.id}`} onClick={(e) => { e.preventDefault(); router.push(`/portal/locations/${c.id}`); }}>
                  {c.name}
                </a>
                <span style={{ color: 'var(--muted-foreground)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{c.type}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
      {location.latitude && location.longitude && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Location</div>
          <Card>
            <MapViewer
              markers={[{ id: location.id, name: location.name, type: location.type, description: location.description, latitude: location.latitude, longitude: location.longitude }]}
              center={[location.latitude, location.longitude]}
              zoom={13}
              height={300}
              compact
            />
          </Card>
        </div>
      )}
    </div>
  );
}
