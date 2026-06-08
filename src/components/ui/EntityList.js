'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import SearchBar from '@/components/ui/SearchBar';
import FilterBuilder from '@/components/ui/FilterBuilder';
import ColumnSelector from '@/components/ui/ColumnSelector';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth, useFormat } from '@/components/auth/AuthProvider';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { unwrap } from '@/lib/unwrap';

export default function EntityList({
  title,
  apiPath,
  detailPath,
  columns,
  searchPlaceholder,
  onCreate,
  bulkEntityType,
  filterFields,
  allColumns,
  columnEntityType,
  selectable = !!bulkEntityType,
  apiParams,
  bulkActionLabel = 'Delete',
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useFormat();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [sort, setSort] = useState('');
  const [order, setOrder] = useState('');
  const [rowLimit, setRowLimit] = useState(100);

  const effectiveSource = allColumns || columns;
  const builtInDefaults = effectiveSource.filter(c => c.default !== false).map(c => c.key);
  const initialVisible = columns.map(c => c.key);
  const [visibleColumns, setVisibleColumns] = useState(initialVisible);
  const [columnSource, setColumnSource] = useState(null);
  const [adminDefaultsForType, setAdminDefaultsForType] = useState(null);

  useEffect(() => {
    if (!columnEntityType || !allColumns) {
      // For portal/custom list views that don't use column personalization, fetch the default rowLimit
      fetch('/api/me/theme')
        .then(r => r.json())
        .then(prefs => {
          const rl = prefs?.rowLimit || prefs?.adminColumnDefaults?._rowLimit || 100;
          setRowLimit(rl);
        })
        .catch(() => setRowLimit(100));
      return;
    }

    async function loadPrefs() {
      try {
        const r = await fetch('/api/me/theme');
        if (!r.ok) return;
        const prefs = await r.json();
        const userPrefs = prefs.columnPrefs;
        const adminDefaults = prefs.adminColumnDefaults;

        const userRL = prefs.rowLimit;
        const adminRL = adminDefaults?._rowLimit;
        setRowLimit(userRL || adminRL || 100);

        if (userPrefs && typeof userPrefs === 'object' && Array.isArray(userPrefs[columnEntityType])) {
          setVisibleColumns(userPrefs[columnEntityType]);
          setColumnSource('user');
          setAdminDefaultsForType(adminDefaults?.[columnEntityType] || null);
        } else if (adminDefaults && Array.isArray(adminDefaults[columnEntityType])) {
          setVisibleColumns(adminDefaults[columnEntityType]);
          setColumnSource('admin');
          setAdminDefaultsForType(null);
        } else {
          setVisibleColumns(builtInDefaults);
          setColumnSource('builtin');
          setAdminDefaultsForType(null);
        }
      } catch {
        setVisibleColumns(builtInDefaults);
        setColumnSource('builtin');
      }
    }
    loadPrefs();
  }, [columnEntityType, allColumns]);

  function handleColumnsApply(selected) {
    setVisibleColumns(selected);
    const keys = [...selected];
    fetch('/api/me/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnPrefs: JSON.stringify({ [columnEntityType]: keys }) }),
    }).then(() => refresh());
    setShowColumns(false);
  }

  const visibleCols = visibleColumns
    .map(key => (allColumns || columns).find(c => c.key === key))
    .filter(Boolean);

  function handleSort(sortKey) {
    setSort(prev => prev === sortKey ? prev : sortKey);
    setOrder(prev => sort === sortKey ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setPage(1);
  }

  const filterState = useRef({});
  const [filterVersion, setFilterVersion] = useState(0);

  const [advFilter, setAdvFilter] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: rowLimit, offset: (page - 1) * rowLimit });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (sort) params.set('sort', sort);
        if (order) params.set('order', order);

        Object.entries(filterState.current).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });

        if (advFilter) params.set('filter', JSON.stringify(advFilter));

        let url = `${apiPath}?${params}`;
        if (apiParams) url += '&' + apiParams;

        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const result = await res.json();
          setData(unwrap(result));
          setTotal(result.total || 0);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading entity list:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    load();
    setSelectedIds(new Set());
    return () => {
      controller.abort();
    };
  }, [apiPath, page, debouncedSearch, sort, order, filterVersion, advFilter, rowLimit, apiParams]);

  const totalPages = Math.ceil(total / rowLimit);

  function handleRowClick(row) {
    const path = typeof detailPath === 'function' ? detailPath(row) : `${detailPath}/${row.id}`;
    router.push(path);
  }

  function handleSelect(row) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id)));
    }
  }

  async function handleBulkDelete() {
    setShowDeleteConfirm(false);
    const res = await fetch('/api/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: bulkEntityType || apiPath.split('/').pop(),
        action: 'delete',
        ids: [...selectedIds],
      }),
    });
    if (res.ok) {
      setSelectedIds(new Set());
      setPage(1);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {selectable && selectedIds.size > 0 && (
            <Button variant="danger" size="small" onClick={() => setShowDeleteConfirm(true)}>
              {bulkActionLabel} ({selectedIds.size})
            </Button>
          )}
          {onCreate && <Button variant="primary" onClick={onCreate}>Create</Button>}
        </div>
      </div>

      <div className={styles.toolbar}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder={searchPlaceholder || 'Search...'}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {selectable && selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                {selectedIds.size} selected
              </span>
              <Button variant="danger" size="small" onClick={() => setShowDeleteConfirm(true)}>
                {bulkActionLabel}
              </Button>
            </div>
          )}
          {allColumns && (
            <Button variant="secondary" size="small" onClick={() => setShowColumns(true)}>
              Columns
            </Button>
          )}
          {filterFields && filterFields.length > 0 && (
            <Button variant="secondary" size="small" onClick={() => setShowAdvFilter(true)}>
              Filters {advFilter ? `(${advFilter.length})` : ''}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <Table
            columns={visibleCols}
            data={data}
            onRowClick={handleRowClick}
            selectable={selectable}
            selected={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            sort={sort}
            order={order}
            onSort={handleSort}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </>
      )}

      <Modal
        open={showDeleteConfirm}
        title={bulkActionLabel === 'Delete' ? 'Confirm Deletion' : `Confirm ${bulkActionLabel}`}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <div style={{ marginBottom: '1rem' }}>
          {bulkActionLabel} {selectedIds.size} selected item{selectedIds.size > 1 ? 's' : ''}? This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleBulkDelete}>{bulkActionLabel}</Button>
        </div>
      </Modal>

      {filterFields && (
        <FilterBuilder
          open={showAdvFilter}
          fields={filterFields}
          initial={advFilter}
          onApply={(conditions) => { setAdvFilter(conditions); setShowAdvFilter(false); setPage(1); }}
          onClear={() => { setAdvFilter(null); setShowAdvFilter(false); setPage(1); }}
          onClose={() => setShowAdvFilter(false)}
        />
      )}

      {allColumns && (
        <ColumnSelector
          open={showColumns}
          columns={allColumns.map(c => ({ key: c.key, label: c.header, always: c.always, default: c.default }))}
          visible={visibleColumns}
          headerNote={columnSource === 'admin' ? 'Using admin-configured defaults. Your changes become a personal override.' : columnSource === 'user' ? 'Your custom column view. Reset to admin defaults.' : 'Using built-in defaults. Changes will be saved as your personal view.'}
          adminDefaults={adminDefaultsForType}
          onApply={handleColumnsApply}
          onClose={() => setShowColumns(false)}
        />
      )}
    </div>
  );
}
