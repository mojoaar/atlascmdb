import { useId } from 'react';
import styles from './Select.module.css';

export default function Select({ label, options = [], id, placeholder = '-- Select --', ...props }) {
  const generatedId = useId();
  const selectId = id || generatedId;
  return (
    <div>
      {label && <label className={styles.label} htmlFor={selectId}>{label}</label>}
      <select id={selectId} className={styles.select} {...props}>
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
