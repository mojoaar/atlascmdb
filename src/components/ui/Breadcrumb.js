import styles from './Breadcrumb.module.css';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className={styles.breadcrumb}>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className={styles.separator}> / </span>}
          {item.href ? (
            <a href={item.href} className={styles.item}>{item.label}</a>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
