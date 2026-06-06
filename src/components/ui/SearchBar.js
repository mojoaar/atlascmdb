import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className={styles.wrapper}>
      <Search size={16} className={styles.icon} />
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
