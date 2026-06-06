'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import RackViewer from '@/components/graph/RackViewer';
import LoadingState from '@/components/ui/LoadingState';

export default function AdminRackLayoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rack, setRack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cis/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load rack');
        return res.json();
      })
      .then(data => {
        setRack(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingState />
      </div>
    );
  }

  if (!rack) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Rack Not Found</h1>
        <button
          onClick={() => router.push('/admin/racks')}
          style={{
            padding: '0.375rem 0.875rem',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          &larr; Back to Racks
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Full Rack Layout</h1>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
            {rack.name} {rack.locationName ? `· ${rack.locationName}` : ''}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => router.push(`/admin/racks/${id}`)}
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
            fontWeight: 500,
          }}
        >
          &larr; Back to Detail
        </button>
      </div>

      <Card>
        <RackViewer
          rackId={id}
          rackSize={rack.rackSize || 42}
          rackName={rack.name}
          locationName={rack.locationName}
          fullScreen={true}
        />
      </Card>
    </div>
  );
}
