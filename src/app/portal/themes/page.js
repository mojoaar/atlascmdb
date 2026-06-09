'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import styles from '@/styles/entity.module.css';
import { unwrap } from '@/lib/unwrap';

export default function ThemesPage() {
  const [themes, setThemes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/themes').then(r => r.json()).then(d => setThemes(unwrap(d))).catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Themes</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {themes.map(theme => (
          <Card key={theme.id} title={theme.name}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
              Light &amp; Dark {theme.isDefault ? '(Default)' : ''} {theme.isSystem ? '(System)' : ''}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
