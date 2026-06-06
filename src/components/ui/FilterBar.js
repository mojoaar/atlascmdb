'use client';

import Select from '@/components/ui/Select';
import styles from './FilterBar.module.css';

export default function FilterBar({ filters = [] }) {
  if (!filters.length) return null;

  return (
    <div className={styles.bar}>
      {filters.map((f) => (
        <div key={f.key} className={styles.item}>
          <Select
            options={f.options}
            value={f.value}
            onChange={f.onChange}
            label={f.label}
          />
        </div>
      ))}
    </div>
  );
}
