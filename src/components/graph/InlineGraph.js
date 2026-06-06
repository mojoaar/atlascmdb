'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GraphViewer from '@/components/graph/GraphViewer';

export default function InlineGraph({ entityType, entityId, basePath = '/portal' }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/entities/${entityType}/${entityId}/graph?depth=2`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [entityType, entityId]);

  if (loading) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>Loading graph...</div>;

  const map = { service: 'services', application: 'applications', ci: 'cis' };

  function handleNodeClick(nodeId, nodeType) {
    const path = map[nodeType];
    if (path) router.push(`${basePath}/${path}/${nodeId}`);
  }

  return (
    <div>
      <GraphViewer data={data} onNodeClick={handleNodeClick} compact />
      <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
        <a
          href={`${basePath}/graph/${entityType}/${entityId}`}
          onClick={(e) => { e.preventDefault(); router.push(`${basePath}/graph/${entityType}/${entityId}`); }}
          style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
        >
          View Full Graph &rarr;
        </a>
      </div>
    </div>
  );
}
