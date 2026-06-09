'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OrgChartViewer from '@/components/graph/OrgChartViewer';
import Card from '@/components/ui/Card';

export default function AdminOrgChartPage() {
  const { id } = useParams();
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .then(res => {
        const user = res.data || res;
        if (user && user.displayName) {
          setUserName(user.displayName);
        }
      })
      .catch(() => {});
  }, [id]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Organisation Chart</h1>
        {userName && (
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            {userName}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => router.push(`/admin/users/${id}`)}
          style={{
            padding: '0.375rem 0.875rem',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          &larr; Back to User
        </button>
      </div>
      <Card>
        <OrgChartViewer userId={id} basePath="/admin" />
      </Card>
    </div>
  );
}
