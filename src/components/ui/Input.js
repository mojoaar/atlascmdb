import { useId } from 'react';
import styles from './Input.module.css';

export default function Input({ label, error, id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={`${styles.field} ${error ? styles.error : ''}`}>
      {label && <label className={styles.label} htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={styles.input} {...props} />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
