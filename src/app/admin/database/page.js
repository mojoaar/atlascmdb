'use client';

import { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, Layers, FileText, ChevronLeft, ChevronRight, X, Copy, Check } from 'lucide-react';
import styles from './page.module.css';

export default function AdminDatabaseExplorer() {
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableSearch, setTableSearch] = useState('');
  const [activeTab, setActiveTab] = useState('rows'); // 'rows' | 'schema'
  
  // Table Data State
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [rowSearch, setRowSearch] = useState('');
  const [sortCol, setSortCol] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected Row for JSON Viewer Modal
  const [viewingRow, setViewingRow] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch all database tables
  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await fetch('/api/admin/database/tables');
        if (res.ok) {
          const body = await res.json();
          const fetchedTables = body.tables || body.data?.tables || [];
          setTables(fetchedTables);
          setFilteredTables(fetchedTables);
          if (fetchedTables.length > 0 && !selectedTable) {
            setSelectedTable(fetchedTables[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load database tables', err);
      } finally {
        setLoadingTables(false);
      }
    }
    fetchTables();
  }, [refreshKey]);

  // Filter tables by search text
  useEffect(() => {
    const query = tableSearch.toLowerCase();
    setFilteredTables(tables.filter(t => t.toLowerCase().includes(query)));
  }, [tableSearch, tables]);

  // Fetch schema and records whenever table or pagination/sort/search query changes
  useEffect(() => {
    if (!selectedTable) return;
    
    let isSubscribed = true;

    async function loadTableData() {
      setLoading(true);
      try {
        const qParams = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          ...(rowSearch && { search: rowSearch }),
          ...(sortCol && { sort: sortCol, order: sortOrder })
        });
        
        const res = await fetch(`/api/admin/database/tables/${selectedTable}?${qParams}`);
        if (res.ok && isSubscribed) {
          const body = await res.json();
          const payload = body.tableName ? body : (body.data || {});
          
          // Schema column headers
          const schemaInfo = payload.schema || {};
          setColumns(Object.keys(schemaInfo).map(colName => ({
            name: colName,
            ...schemaInfo[colName]
          })));

          setRows(payload.data || []);
          setTotalRows(payload.total || 0);
        }
      } catch (err) {
        console.error('Failed to load table data', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadTableData();

    return () => {
      isSubscribed = false;
    };
  }, [selectedTable, limit, offset, rowSearch, sortCol, sortOrder, refreshKey]);

  const handleTableChange = (tableName) => {
    setSelectedTable(tableName);
    setOffset(0);
    setRowSearch('');
    setSortCol('');
    setSortOrder('asc');
    setViewingRow(null);
  };

  const handleRowSearchChange = (e) => {
    setRowSearch(e.target.value);
    setOffset(0);
  };

  const handleSort = (colName) => {
    if (sortCol === colName) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colName);
      setSortOrder('asc');
    }
    setOffset(0);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalRows / limit) || 1;

  return (
    <div className={styles.container}>
      {/* LEFT PANEL: Table List */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <Database size={18} />
            <span>Tables</span>
          </div>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search tables..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tableList}>
          {loadingTables ? (
            <div className={styles.loadingState}>Loading tables...</div>
          ) : filteredTables.length === 0 ? (
            <div className={styles.emptyState}>No tables found</div>
          ) : (
            filteredTables.map(tName => (
              <button
                key={tName}
                onClick={() => handleTableChange(tName)}
                className={`${styles.tableItem} ${selectedTable === tName ? styles.tableItemActive : ''}`}
              >
                <Layers size={14} />
                <span className={styles.tableNameText}>{tName}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* RIGHT PANEL: Details & Rows View */}
      <main className={styles.content}>
        {selectedTable ? (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div>
                <h1 className={styles.title}>{selectedTable}</h1>
                <p className={styles.subtitle}>
                  {totalRows} records • {columns.length} columns
                </p>
              </div>
              <div className={styles.headerActions}>
                <button 
                  onClick={() => {
                    // Trigger dynamic table refetch
                    setRefreshKey(prev => prev + 1);
                  }} 
                  className={styles.refreshButton}
                  title="Refresh Table"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Filter Toolbar / Tab Controls */}
            <div className={styles.toolbar}>
              <div className={styles.tabs}>
                <button
                  onClick={() => setActiveTab('rows')}
                  className={`${styles.tabButton} ${activeTab === 'rows' ? styles.tabButtonActive : ''}`}
                >
                  <Layers size={14} />
                  <span>Rows</span>
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`${styles.tabButton} ${activeTab === 'schema' ? styles.tabButtonActive : ''}`}
                >
                  <FileText size={14} />
                  <span>Schema</span>
                </button>
              </div>

              {activeTab === 'rows' && (
                <div className={styles.rowSearchWrapper}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search rows..."
                    value={rowSearch}
                    onChange={handleRowSearchChange}
                    className={styles.rowSearchInput}
                  />
                </div>
              )}
            </div>

            {/* Main Area */}
            <div className={styles.viewerArea}>
              {loading ? (
                <div className={styles.tableLoadingOverlay}>
                  <div className={styles.spinner} />
                  <span>Loading data...</span>
                </div>
              ) : activeTab === 'rows' ? (
                <div className={styles.gridContainer}>
                  {rows.length === 0 ? (
                    <div className={styles.noDataState}>
                      <Database size={40} className={styles.noDataIcon} />
                      <h3>No Records Found</h3>
                      <p>This table is currently empty or doesn't match your filter.</p>
                    </div>
                  ) : (
                    <div className={styles.tableWrapper}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th className={styles.actionsHeader}>Action</th>
                            {columns.map(col => (
                              <th 
                                key={col.name} 
                                onClick={() => handleSort(col.name)}
                                className={styles.sortableHeader}
                              >
                                <div className={styles.headerInner}>
                                  <span>{col.name}</span>
                                  {sortCol === col.name && (
                                    <span className={styles.sortArrow}>
                                      {sortOrder === 'asc' ? ' ▲' : ' ▼'}
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, idx) => (
                            <tr key={row.id || idx}>
                              <td className={styles.actionCell}>
                                <button
                                  onClick={() => setViewingRow(row)}
                                  className={styles.viewRowButton}
                                  title="View Full JSON Record"
                                >
                                  View
                                </button>
                              </td>
                              {columns.map(col => {
                                const val = row[col.name];
                                let renderedVal = '';
                                if (val === null || val === undefined) {
                                  renderedVal = 'NULL';
                                } else if (typeof val === 'object') {
                                  renderedVal = JSON.stringify(val);
                                } else {
                                  renderedVal = String(val);
                                }
                                
                                return (
                                  <td 
                                    key={col.name} 
                                    className={`${styles.dataCell} ${val === null ? styles.nullCell : ''}`}
                                    title={renderedVal}
                                  >
                                    {renderedVal}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Schema Tab */
                <div className={styles.schemaContainer}>
                  <table className={styles.schemaTable}>
                    <thead>
                      <tr>
                        <th>Column Name</th>
                        <th>Data Type</th>
                        <th>Nullable</th>
                        <th>Default Value</th>
                        <th>Max Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map(col => (
                        <tr key={col.name}>
                          <td className={styles.schemaColName}>{col.name}</td>
                          <td>
                            <span className={styles.schemaBadgeType}>{col.type || 'unknown'}</span>
                          </td>
                          <td>
                            <span className={col.nullable ? styles.schemaBadgeYes : styles.schemaBadgeNo}>
                              {col.nullable ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className={styles.schemaColDefault}>
                            {col.defaultValue === null || col.defaultValue === undefined ? '—' : String(col.defaultValue)}
                          </td>
                          <td>{col.maxLength || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Pagination */}
            {activeTab === 'rows' && rows.length > 0 && (
              <div className={styles.footer}>
                <div className={styles.limitSelector}>
                  <span>Rows per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(parseInt(e.target.value, 10));
                      setOffset(0);
                    }}
                    className={styles.limitSelect}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className={styles.paginationInfo}>
                  Showing {offset + 1} - {Math.min(offset + rows.length, totalRows)} of {totalRows}
                </div>
                <div className={styles.paginationControls}>
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className={styles.pageButton}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className={styles.pageIndicator}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= totalRows}
                    className={styles.pageButton}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noTableSelected}>
            <Database size={64} className={styles.noTableSelectedIcon} />
            <h2>No Table Selected</h2>
            <p>Select a table from the sidebar to inspect its structure and records.</p>
          </div>
        )}
      </main>

      {/* JSON INSPECTOR MODAL */}
      {viewingRow && (
        <div className={styles.modalOverlay} onClick={() => setViewingRow(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Database size={16} />
                <span>Record Details ({selectedTable})</span>
              </div>
              <div className={styles.modalHeaderActions}>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(viewingRow, null, 2))}
                  className={styles.copyButton}
                  title="Copy JSON to clipboard"
                >
                  {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button onClick={() => setViewingRow(null)} className={styles.closeButton}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.modalBody}>
              <pre className={styles.jsonBlock}>
                <code>{JSON.stringify(viewingRow, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
