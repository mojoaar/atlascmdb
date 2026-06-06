import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', size, disabled, onClick, type = 'button', className = '', style, ...props }) {
  const classes = [
    styles.button,
    styles[variant],
    size === 'small' ? styles.small : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} style={style} {...props}>
      {children}
    </button>
  );
}
