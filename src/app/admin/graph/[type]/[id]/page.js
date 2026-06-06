'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GraphViewer from '@/components/graph/GraphViewer';
import Card from '@/components/ui/Card';
import { useFormat } from '@/components/auth/AuthProvider';

const DEPTH_OPTIONS = [
  { value: '1', label: '1 level' },
  { value: '2', label: '2 levels' },
  { value: '3', label: '3 levels' },
  { value: '4', label: '4 levels' },
  { value: '5', label: '5 levels' },
  { value: '6', label: '6 levels' },
];

export default function AdminGraphPage() {
  const { type, id } = useParams();
  const router = useRouter();
  const { refresh } = useFormat();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depth, setDepth] = useState(3);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      if (u?.graphDepth) setDepth(u.graphDepth);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/entities/${type}/${id}/graph?depth=${depth}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [type, id, depth]);

  function handleNodeClick(nodeId, nodeType) {
    const map = { service: 'services', application: 'applications', ci: 'cis' };
    const path = map[nodeType];
    if (path) router.push(`/admin/${path}/${nodeId}`);
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading graph...</div>;
  }

  const nodeCount = data?.nodes?.length || 0;
  const edgeCount = data?.edges?.length || 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Relationship Graph</h1>
        {data?.center && (
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            {data.center.name}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{nodeCount} nodes, {edgeCount} edges</span>
        <select
          value={String(depth)}
          onChange={(e) => setDepth(Number(e.target.value))}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          {DEPTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={() => {
            const map = { service: 'services', application: 'applications', ci: 'cis' };
            router.push(`/admin/${map[type]}/${id}`);
          }}
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
          &larr; Back
        </button>
      </div>
      <Card>
        <GraphViewer data={data} onNodeClick={handleNodeClick} />
      </Card>
    </div>
  );
}
