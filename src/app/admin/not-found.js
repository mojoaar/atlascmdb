import Link from 'next/link';
import styles from '../boundary.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.message}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className={styles.actions}>
        <Link href="/admin" className={styles.link}>Back to dashboard</Link>
      </div>
    </div>
  );
}
