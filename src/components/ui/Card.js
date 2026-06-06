import styles from './Card.module.css';

export default function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {(title || actions) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
