'use client';

import { useState, useEffect } from 'react';
import Table from './Table';
import Badge from './Badge';
import Modal from './Modal';
import { useFormat } from '@/components/auth/AuthProvider';
import { unwrap } from '@/lib/unwrap';

const ACTION_BADGES = {
  created: 'success',
  updated: 'info',
  deleted: 'danger',
  login: 'default',
  logout: 'default',
};

const SKIP_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

function renderChanges(event) {
  if (event.action !== 'updated') return '—';
  let before = {};
  let after = {};
  try { before = typeof event.beforeData === 'string' ? JSON.parse(event.beforeData) : (event.beforeData || {}); } catch {}
  try { after = typeof event.afterData === 'string' ? JSON.parse(event.afterData) : (event.afterData || {}); } catch {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diffs = [];
  for (const key of keys) {
    if (SKIP_KEYS.has(key)) continue;
    if (!(key in before) || !(key in after)) continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diffs.push(key);
    }
  }
  if (!diffs.length) return '—';
  return diffs.slice(0, 3).join(', ') + (diffs.length > 3 ? ` +${diffs.length - 3} more` : '');
}

function formatJSON(raw) {
  if (!raw) return '—';
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return JSON.stringify(obj, null, 2);
  } catch { return raw; }
}

export default function AuditTrail({ entityType, entityId }) {
  const { formatDateTime } = useFormat();
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`/api/audit-events?entityType=${entityType}&entityId=${entityId}&limit=10&order=desc`)
      .then(r => r.json())
      .then(r => setEvents(unwrap(r, [])))
      .catch(() => setEvents([]));
  }, [entityType, entityId]);

  const columns = [
    { key: 'createdAt', header: 'Timestamp', render: (r) => formatDateTime(r.createdAt), width: 140 },
    { key: 'actorName', header: 'Actor', render: (r) => r.actorName || r.actorEmail || '—' },
    { key: 'action', header: 'Action', render: (r) => <Badge variant={ACTION_BADGES[r.action] || 'default'}>{r.action}</Badge>, width: 80 },
    { key: 'changes', header: 'Changes', render: (r) => renderChanges(r) },
  ];

  if (!events.length) return <div style={{ padding: '1rem', color: 'var(--muted-foreground)', fontSize: '0.8125rem', textAlign: 'center' }}>No audit events</div>;

  return (
    <>
      <Table columns={columns} data={events} onRowClick={(r) => setSelected(r)} />
      {selected && (
        <Modal title="Audit Event Detail" open={!!selected} onClose={() => setSelected(null)}>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <div><strong>Actor:</strong> {selected.actorName || selected.actorEmail || '—'}</div>
            <div><strong>Action:</strong> <Badge variant={ACTION_BADGES[selected.action] || 'default'}>{selected.action}</Badge></div>
            <div><strong>Entity Type:</strong> {selected.entityType || '—'}</div>
            <div><strong>Timestamp:</strong> {formatDateTime(selected.createdAt)}</div>
            {selected.beforeData && (
              <div>
                <strong>Before:</strong>
                <pre style={{ background: 'var(--muted)', padding: '0.5rem', borderRadius: 'var(--radius)', fontSize: '0.75rem', maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{formatJSON(selected.beforeData)}</pre>
              </div>
            )}
            {selected.afterData && (
              <div>
                <strong>After:</strong>
                <pre style={{ background: 'var(--muted)', padding: '0.5rem', borderRadius: 'var(--radius)', fontSize: '0.75rem', maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{formatJSON(selected.afterData)}</pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
