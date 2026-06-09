'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-powershell';
import styles from './CodeBlock.module.css';

export default function CodeBlock({ children, language, copyable }) {
  const codeRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      prism.highlightElement(codeRef.current);
    }
  }, [children]);

  function handleCopy() {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.wrapper}>
      {copyable !== false && (
        <button className={styles.copyBtn} onClick={handleCopy}>
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
      )}
      <pre className={styles.pre} suppressHydrationWarning>
        <code ref={codeRef} className={`language-${language || 'bash'}`}>
          {children}
        </code>
      </pre>
    </div>
  );
}
