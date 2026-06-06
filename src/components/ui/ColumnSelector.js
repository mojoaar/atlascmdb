'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Modal from './Modal';
import styles from './ColumnSelector.module.css';

export default function ColumnSelector({ open, columns, visible, onApply, onClose, headerNote, adminDefaults }) {
  const [orderedKeys, setOrderedKeys] = useState([]);
  const [visibleSet, setVisibleSet] = useState(new Set());

  useEffect(() => {
    if (open) {
      const visibleArray = Array.isArray(visible) ? visible : [...visible];
      const initialVisibleSet = new Set(visibleArray);

      // Build order: all visible columns first (in their existing order), then any hidden ones in their original columns order
      const allKeys = [...visibleArray];
      for (const col of columns) {
        if (!initialVisibleSet.has(col.key)) {
          allKeys.push(col.key);
        }
      }
      setOrderedKeys(allKeys);
      setVisibleSet(initialVisibleSet);
    }
  }, [open, visible, columns]);

  function toggle(key) {
    setVisibleSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function moveUp(index) {
    if (index === 0) return;
    setOrderedKeys(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  }

  function moveDown(index) {
    if (index === orderedKeys.length - 1) return;
    setOrderedKeys(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  }

  function handleApply() {
    const result = orderedKeys.filter(key => visibleSet.has(key));
    onApply(result);
  }

  function handleReset() {
    const defaultVisibleKeys = adminDefaults && adminDefaults.length
      ? adminDefaults
      : columns.filter(c => c.default !== false).map(c => c.key);

    const initialVisibleSet = new Set(defaultVisibleKeys);

    const allKeys = [...defaultVisibleKeys];
    for (const col of columns) {
      if (!initialVisibleSet.has(col.key)) {
        allKeys.push(col.key);
      }
    }
    setOrderedKeys(allKeys);
    setVisibleSet(initialVisibleSet);
  }

  return (
    <Modal title="Show/Hide Columns" open={open} onClose={onClose} className={styles.modalOverride}>
      {headerNote && (
        <div style={{ padding: '0.5rem 0', fontSize: '0.75rem', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem' }}>
          {headerNote}
        </div>
      )}
      <div className={styles.body}>
        {orderedKeys.map((key, index) => {
          const col = columns.find(c => c.key === key);
          if (!col) return null;
          return (
            <div key={key} className={styles.row}>
              <label className={styles.labelPart}>
                <input
                  type="checkbox"
                  checked={visibleSet.has(key)}
                  onChange={() => toggle(key)}
                  disabled={col.always}
                  aria-label={`Show ${col.label} column`}
                />
                <span className={col.always ? styles.always : ''}>{col.label}</span>
                {col.always && <span className={styles.required}>(required)</span>}
              </label>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.moveBtn}
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  title="Move up"
                  aria-label={`Move ${col.label} up`}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className={styles.moveBtn}
                  onClick={() => moveDown(index)}
                  disabled={index === orderedKeys.length - 1}
                  title="Move down"
                  aria-label={`Move ${col.label} down`}
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.footer}>
        <Button variant="ghost" size="small" onClick={handleReset}>Reset to defaults</Button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="small" onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </Modal>
  );
}
