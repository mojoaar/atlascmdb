'use client';

import { useState } from 'react';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { X, Plus } from 'lucide-react';
import styles from './FilterBuilder.module.css';

const OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'isEmpty', label: 'is empty' },
];

export default function FilterBuilder({ open, fields = [], initial, onApply, onClear, onClose }) {
  const [rows, setRows] = useState(() => {
    if (initial && initial.length) return initial;
    return [{ field: fields[0]?.value || '', op: 'contains', value: '' }];
  });

  function updateRow(idx, key, val) {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  }

  function addRow() {
    setRows(prev => [...prev, { field: fields[0]?.value || '', op: 'contains', value: '' }]);
  }

  function removeRow(idx) {
    setRows(prev => prev.filter((_, i) => i !== idx));
  }

  function handleApply() {
    const valid = rows.filter(r => r.field && (r.op === 'isEmpty' || r.value));
    onApply(valid.length ? valid : null);
  }

  if (!open) return null;

  return (
    <Modal open={open} title="Advanced Filter" onClose={onClose}>
      <div className={styles.body}>
        {rows.map((row, idx) => (
          <div key={idx} className={styles.row}>
            <div className={styles.field}>
              <Select
                options={fields}
                value={row.field}
                onChange={(e) => updateRow(idx, 'field', e.target.value)}
                label={idx === 0 ? 'Field' : undefined}
              />
            </div>
            <div className={styles.op}>
              <Select
                options={OPERATORS}
                value={row.op}
                onChange={(e) => updateRow(idx, 'op', e.target.value)}
                label={idx === 0 ? 'Operator' : undefined}
              />
            </div>
            <div className={styles.val}>
              {row.op !== 'isEmpty' ? (
                <Input
                  value={row.value}
                  onChange={(e) => updateRow(idx, 'value', e.target.value)}
                  placeholder="Value..."
                  label={idx === 0 ? 'Value' : undefined}
                />
              ) : (
                <div style={{ paddingTop: idx === 0 ? '1.5rem' : 0 }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', padding: '0.5rem 0' }}>—</div>
                </div>
              )}
            </div>
            <div className={styles.remove}>
              {idx === 0 ? <div style={{ height: '1.5rem' }} /> : null}
              <button type="button" className={styles.removeBtn} onClick={() => removeRow(idx)} title="Remove">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        <button type="button" className={styles.addBtn} onClick={addRow}>
          <Plus size={14} />
          Add condition
        </button>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClear}>Clear all</Button>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleApply}>Apply</Button>
      </div>
    </Modal>
  );
}
