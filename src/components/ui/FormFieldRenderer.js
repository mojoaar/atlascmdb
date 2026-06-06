'use client';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import styles from './FormFieldRenderer.module.css';

export default function FormFieldRenderer({ fieldDef, value, viewMode, onChange, referenceData }) {
  const { id, label, type, inputType, options, optionsRef } = fieldDef;
  const isSelect = type === 'select';

  if (isSelect) {
    const opts = optionsRef && referenceData?.[optionsRef] ? referenceData[optionsRef] : (options || []);
    if (viewMode) {
      const labelText = opts.find(o => o.value === value)?.label || value || '\u2014';
      return (
        <div className={styles.field}>
          <div className={styles.fieldLabel}>{label}</div>
          <div className={styles.fieldValue}>{labelText}</div>
        </div>
      );
    }
    return (
      <div>
        <Select label={label} options={opts} value={value || ''} onChange={e => onChange(id, e.target.value)} />
      </div>
    );
  }

  if (viewMode) {
    return (
      <div className={styles.field}>
        <div className={styles.fieldLabel}>{label}</div>
        <div className={styles.fieldValue} style={inputType === 'textarea' ? { whiteSpace: 'pre-wrap' } : undefined}>{value || '\u2014'}</div>
      </div>
    );
  }

  if (inputType === 'date') {
    return (
      <div>
        <Input label={label} type="date" value={value || ''} onChange={e => onChange(id, e.target.value)} />
      </div>
    );
  }

  if (inputType === 'number') {
    return (
      <div>
        <Input label={label} type="number" step="0.01" value={value || ''} onChange={e => onChange(id, e.target.value)} />
      </div>
    );
  }

  if (inputType === 'textarea') {
    return (
      <div>
        <textarea
          value={value || ''}
          onChange={e => onChange(id, e.target.value)}
          rows={4}
          className={styles.textarea}
          placeholder={label}
        />
      </div>
    );
  }

  return (
    <div>
      <Input label={label} value={value || ''} onChange={e => onChange(id, e.target.value)} />
    </div>
  );
}
