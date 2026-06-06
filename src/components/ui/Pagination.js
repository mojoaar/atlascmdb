import styles from './Pagination.module.css';

export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageBtn}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      {start > 1 && <span className={styles.info}>...</span>}
      {pages.map(p => (
        <button
          key={p}
          className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className={styles.info}>...</span>}
      <button
        className={styles.pageBtn}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
      <span className={styles.info}>Page {page} of {totalPages}</span>
    </div>
  );
}
