'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import FilterBuilder from '@/components/ui/FilterBuilder';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ColumnSelector from '@/components/ui/ColumnSelector';
import { useAuth, useFormat } from '@/components/auth/AuthProvider';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { unwrap } from '@/lib/unwrap';

const ACTION_BADGES = {
  created: 'success',
  updated: 'info',
  deleted: 'danger',
  login: 'default',
  logout: 'default',
};

const filterFields = [
  { value: 'actorName', label: 'Actor Name' },
  { value: 'action', label: 'Action' },
  { value: 'entityType', label: 'Entity Type' },
  { value: 'entityId', label: 'Entity ID' },
];

const allColumns = [
  { key: 'createdAt', header: 'Timestamp', always: true, sortable: true, sortKey: 'createdAt' },
  { key: 'actorName', header: 'Actor', sortable: true },
  { key: 'action', header: 'Action', sortable: true },
  { key: 'entityType', header: 'Entity Type', sortable: true },
  { key: 'entityId', header: 'Entity ID' },
  { key: 'actorEmail', header: 'Email', default: false },
];

export default function AuditEventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { formatDateTime } = useFormat();
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [order, setOrder] = useState('');
  const [advFilter, setAdvFilter] = useState(null);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [columnSource, setColumnSource] = useState(null);
  const [auditAdminDefaults, setAuditAdminDefaults] = useState(null);
  const [rowLimit, setRowLimit] = useState(100);

  useEffect(() => {
    async function loadPrefs() {
      const builtIn = new Set(allColumns.filter(c => c.default !== false).map(c => c.key));
      try {
        const r = await fetch('/api/me/theme');
        if (!r.ok) { setVisibleColumns(builtIn); return; }
        const prefs = await r.json();
        const userPrefs = prefs.columnPrefs;
        const adminDefaults = prefs.adminColumnDefaults;
        const userRL = prefs.rowLimit;
        const adminRL = adminDefaults?._rowLimit;
        setRowLimit(userRL || adminRL || 100);
        if (userPrefs && typeof userPrefs === 'object' && Array.isArray(userPrefs.audit_events)) {
          setVisibleColumns(new Set(userPrefs.audit_events));
          setColumnSource('user');
          setAuditAdminDefaults(adminDefaults?.audit_events || null);
        } else if (adminDefaults && Array.isArray(adminDefaults.audit_events)) {
          setVisibleColumns(new Set(adminDefaults.audit_events));
          setColumnSource('admin');
          setAuditAdminDefaults(null);
        } else {
          setVisibleColumns(builtIn);
          setColumnSource('builtin');
          setAuditAdminDefaults(null);
        }
      } catch {
        setVisibleColumns(builtIn);
        setColumnSource('builtin');
      }
    }
    loadPrefs();
  }, []);

  async function handleColumnsApply(selected) {
    setVisibleColumns(selected);
    setShowColumns(false);
    await fetch('/api/me/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnPrefs: JSON.stringify({ audit_events: [...selected] }) }),
    }).catch(() => {});
  }

  async function handleRowClick(row) {
    const res = await fetch(`/api/audit-events/${row.id}`);
    if (res.ok) {
      const result = await res.json();
      setSelectedEvent(unwrap(result));
    }
  }

  function handleSort(col) {
    if (col === sort) {
      setOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(col);
      setOrder('asc');
    }
    setPage(1);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ limit: rowLimit, offset: (page - 1) * rowLimit });
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      if (order) params.set('order', order);
      if (advFilter) params.set('filter', JSON.stringify(advFilter));
      const res = await fetch(`/api/audit-events?${params}`);
      if (res.ok) {
        const result = await res.json();
        setEvents(unwrap(result));
        setTotal(result.total || 0);
      }
      setLoading(false);
    }
    load();
  }, [page, search, sort, order, advFilter, rowLimit]);

  const allColsWithRender = allColumns.map(c => {
    if (c.key === 'createdAt') return { ...c, render: (r) => formatDateTime(r.createdAt) };
    if (c.key === 'actorName') return { ...c, render: (r) => r.actorName || r.actorEmail || '—' };
    if (c.key === 'action') return { ...c, render: (r) => <Badge variant={ACTION_BADGES[r.action] || 'default'}>{r.action}</Badge> };
    if (c.key === 'entityId') return { ...c, render: (r) => r.entityId ? r.entityId.substring(0, 12) + '...' : '—' };
    if (c.key === 'actorEmail') return { ...c, render: (r) => r.actorEmail || '—' };
    return c;
  });

  const visibleCols = visibleColumns.size
    ? allColsWithRender.filter(c => visibleColumns.has(c.key) || c.always)
    : allColsWithRender.filter(c => c.default !== false);

  const totalPages = Math.ceil(total / rowLimit);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Audit Events</h1>
      </div>

      <div className={styles.toolbar}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by actor..."
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button variant="secondary" size="small" onClick={() => setShowColumns(true)}>
            Columns
          </Button>
          <Button variant="secondary" size="small" onClick={() => setShowFilterBuilder(true)}>
            Filters {advFilter ? `(${advFilter.length})` : ''}
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <Table columns={visibleCols} data={events} sort={sort} order={order} onSort={handleSort} onRowClick={handleRowClick} />
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </>
      )}

      {showColumns && (
        <ColumnSelector
          open={showColumns}
          columns={allColumns.map(c => ({ key: c.key, label: c.header, always: c.always, default: c.default }))}
          selected={visibleColumns}
          headerNote={columnSource === 'admin' ? 'Using admin-configured defaults.' : columnSource === 'user' ? 'Your custom column view.' : 'Using built-in defaults.'}
          adminDefaults={auditAdminDefaults}
          onApply={handleColumnsApply}
          onClose={() => setShowColumns(false)}
        />
      )}

      {showFilterBuilder && (
        <FilterBuilder
          open={showFilterBuilder}
          fields={filterFields}
          initial={advFilter || []}
          onApply={(f) => { setAdvFilter(f.length ? f : null); setShowFilterBuilder(false); setPage(1); }}
          onClear={() => { setAdvFilter(null); setShowFilterBuilder(false); setPage(1); }}
          onClose={() => setShowFilterBuilder(false)}
        />
      )}

      {selectedEvent && (
        <Modal title="Audit Event Detail" open={!!selectedEvent} onClose={() => setSelectedEvent(null)}>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <div><strong>Actor:</strong> {selectedEvent.actorName || selectedEvent.actorEmail || '—'}</div>
            <div><strong>Action:</strong> <Badge variant={ACTION_BADGES[selectedEvent.action] || 'default'}>{selectedEvent.action}</Badge></div>
            <div><strong>Entity Type:</strong> {selectedEvent.entityType || '—'}</div>
            <div><strong>Entity ID:</strong> {selectedEvent.entityId || '—'}</div>
            <div><strong>Timestamp:</strong> {formatDateTime(selectedEvent.createdAt)}</div>
            {selectedEvent.beforeData && (
              <div>
                <strong>Before:</strong>
                <pre style={{ background: 'var(--muted)', padding: '0.5rem', borderRadius: 'var(--radius)', fontSize: '0.75rem', maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(JSON.parse(selectedEvent.beforeData), null, 2)}
                </pre>
              </div>
            )}
            {selectedEvent.afterData && (
              <div>
                <strong>After:</strong>
                <pre style={{ background: 'var(--muted)', padding: '0.5rem', borderRadius: 'var(--radius)', fontSize: '0.75rem', maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(JSON.parse(selectedEvent.afterData), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
