'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import DetailMenu from '@/components/ui/DetailMenu';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import Field from '@/components/ui/Field';
import { useApi } from '@/lib/useApi';

export default function TeamDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: team, loading } = useApi(`/api/teams/${id}`);

  if (loading) return <LoadingState />;
  if (!team) return <div style={{ padding: '2rem', textAlign: 'center' }}>Team not found</div>;

  const memberColumns = [
    { key: 'displayName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'memberRole', header: 'Team Role' },
  ];

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/portal/teams" onClick={(e) => { e.preventDefault(); router.push('/portal/teams'); }}>&larr; Back to Teams</a>
      </div>
      <div className={styles.detailHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <DetailMenu id={id} entityType="team" data={team} />
          <h1 className={styles.detailTitle}>{team.name}</h1>
        </div>
        <div className={styles.meta}>
          <span>Type: {team.type}</span>
          <span>Status: {team.status}</span>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Details</div>
        <Card>
          <div className={styles.fieldGrid}>
            <Field label="Description" value={team.description || '—'} />
            <Field label="Type" value={team.type || '—'} />
            <Field label="Ownership Scope" value={team.ownershipScope || '—'} />
            <Field label="Parent Team" value={team.parentTeamName || '—'} />
            <Field label="Assigned Role" value={team.roleName || '—'} />
            <Field label="Manager" value={team.managerName || '—'} />
            <Field label="Lead / Product Owner" value={team.leadName || '—'} />
          </div>
        </Card>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Members ({team.members?.length || 0})</div>
        <Table columns={memberColumns} data={team.members || []} />
      </div>
    </div>
  );
}
