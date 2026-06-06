import styles from './Table.module.css';

export default function Table({ columns = [], data = [], onRowClick, selectable, selected, onSelect, onSelectAll, sort, order, onSort }) {
  const allSelected = data.length > 0 && data.every(d => selected?.has(d.id));

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col, i) => {
              const sortKey = col.sortKey || col.key;
              const isSortable = !!(onSort && col.sortable !== false && sortKey);
              const isActive = isSortable && sort === sortKey;

              return (
                <th
                  key={i}
                  style={{ width: col.width, ...(isSortable ? { cursor: 'pointer' } : {}) }}
                  onClick={isSortable ? () => onSort(sortKey) : undefined}
                  className={isSortable ? styles.sortable : undefined}
                >
                  {col.header}
                  {isActive && (
                    <span className={styles.sortIcon}>{order === 'desc' ? ' ▼' : ' ▲'}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={selectable ? columns.length + 1 : columns.length} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem' }}>
                No data
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {selectable && (
                  <td style={{ width: 40 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected?.has(row.id) || false}
                      onChange={() => onSelect?.(row)}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {columns.map((col, j) => (
                  <td key={j} onClick={() => onRowClick?.(row)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
