import styles from '@/styles/entity.module.css';

export default function Field({ label, value, link }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>
        {link ? (
          <a href={link} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            {value}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
