'use client';
import { useEffect, useId, useRef } from 'react';
import styles from './Modal.module.css';

export default function Modal({ title, children, onClose, open, className = '', headerClassName = '' }) {
  const modalRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      const handler = (e) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }
        if (e.key === 'Tab') {
          const focusable = modalRef.current?.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', handler);
      // Move focus into the dialog when it opens.
      const previouslyFocused = document.activeElement;
      modalRef.current?.focus();
      return () => {
        document.removeEventListener('keydown', handler);
        if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className={`${styles.modal} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={`${styles.header} ${headerClassName}`.trim()}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close dialog">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
