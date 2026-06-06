'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './HelpIcon.module.css';

export default function HelpIcon({ text }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  useEffect(() => {
    if (show && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.top - 8, left: r.left + r.width / 2 });
    }
  }, [show]);

  return (
    <span className={styles.wrapper}>
      <span
        ref={ref}
        className={styles.icon}
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShow(!show); } }}
        aria-label="Help"
      >
        ?
      </span>
      {show && (
        <span
          className={styles.tooltip}
          style={{ top: pos.top, left: pos.left }}
        >
          {Array.isArray(text) ? text.map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>) : text}
        </span>
      )}
    </span>
  );
}
