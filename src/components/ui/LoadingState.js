import { Loader } from 'lucide-react';
import styles from './LoadingState.module.css';

// Shared centered loading indicator. Replaces the ~24 inline
// `<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading...</div>`
// blocks scattered across pages.
export default function LoadingState({ label = 'Loading...', spinner = true, className = '' }) {
  return (
    <div className={`${styles.loading} ${className}`.trim()} role="status" aria-live="polite">
      {spinner && <Loader size={16} className={styles.spinner} aria-hidden="true" />}
      <span>{label}</span>
    </div>
  );
}
