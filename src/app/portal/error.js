'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import styles from '../boundary.module.css';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.message}>
        An unexpected error occurred while loading this page. You can try again,
        and if the problem persists, contact your administrator.
      </p>
      <div className={styles.actions}>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}
