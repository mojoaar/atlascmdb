'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Copy, Link, Code, Check, Loader } from 'lucide-react';
import Modal from './Modal';
import styles from './DetailMenu.module.css';

const ENTITY_API = {
  service: 'services', application: 'applications', ci: 'cis',
  asset: 'assets', team: 'teams', location: 'locations',
  user: 'users', role: 'roles', relationship: 'relationships',
};

const FK_MAP = {
  ownerTeamId: 'team', locationId: 'location', ciId: 'ci',
  assignedTo: 'user', managerId: 'user', leadId: 'user',
  parentLocationId: 'location', parentTeamId: 'team',
  roleId: 'role', serviceBaseId: 'service',
  createdBy: 'user', updatedBy: 'user',
};

function resolveKey(key, val) {
  if (key.endsWith('Id') && val) {
    const fkType = FK_MAP[key];
    if (!fkType) return null;
    return { base: key.slice(0, -2), api: ENTITY_API[fkType] || fkType };
  }
  if (FK_MAP[key] && val) {
    const fkType = FK_MAP[key];
    return { base: key, api: ENTITY_API[fkType] || fkType };
  }
  return null;
}

export default function DetailMenu({ id, entityType, data, basePath, extraItems }) {
  const [open, setOpen] = useState(false);
  const [showJSON, setShowJSON] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [open]);

  async function buildResolvedJSON() {
    setJsonLoading(true);
    setJsonData(null);

    const apiEntity = ENTITY_API[entityType] || entityType;

    const entityRes = await fetch(`/api/${apiEntity}/${id}`);
    const entity = entityRes.ok ? await entityRes.json() : (data || {});

    const refPromises = [];
    const refBases = [];

    for (const key of Object.keys(entity)) {
      const rk = resolveKey(key, entity[key]);
      if (!rk) continue;
      refPromises.push(
        fetch(`/api/${rk.api}/${entity[key]}`).then(r => r.ok ? r.json() : null).catch(() => null)
      );
      refBases.push(rk.base);
    }

    const refResults = await Promise.all(refPromises);
    const result = { ...entity };
    for (let i = 0; i < refBases.length; i++) {
      if (refResults[i]) result[refBases[i]] = refResults[i];
    }

    setJsonData(result);
    setJsonLoading(false);
  }

  function handleShowJSON() {
    setOpen(false);
    setShowJSON(true);
    buildResolvedJSON();
  }

  function handleCopy(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    }).catch(() => {});
  }

  const jsonString = jsonData ? JSON.stringify(jsonData, null, 2) : '';
  const url = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <div className={styles.container} ref={menuRef}>
        <button
          className={styles.trigger}
          onClick={() => setOpen(!open)}
          title="Actions"
          aria-label="Actions menu"
        >
          <MoreVertical size={18} />
        </button>
        {open && (
          <div className={styles.dropdown}>
            <button className={styles.item} onClick={() => handleCopy(id, 'uuid')}>
              {copied === 'uuid' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied === 'uuid' ? 'Copied!' : 'Copy UUID'}</span>
            </button>
            <button className={styles.item} onClick={() => handleCopy(url, 'url')}>
              {copied === 'url' ? <Check size={14} /> : <Link size={14} />}
              <span>{copied === 'url' ? 'Copied!' : 'Copy URL'}</span>
            </button>
            <button className={styles.item} onClick={handleShowJSON}>
              <Code size={14} />
              <span>Show JSON</span>
            </button>
            {extraItems && extraItems.length > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
                {extraItems.map((item, i) => (
                  <button key={i} className={styles.item} onClick={item.onClick}>
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {showJSON && (
        <Modal title={entityType ? `${entityType} — JSON` : 'Raw JSON'} onClose={() => setShowJSON(false)} open={showJSON}>
          {jsonLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', color: 'var(--muted-foreground)' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
            </div>
          ) : (
            <>
              <div style={{ background: 'var(--muted)', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '50vh', overflow: 'auto' }}>
                {jsonString}
              </div>
              <button
                onClick={() => handleCopy(jsonString, 'json')}
                style={{
                  marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                  background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '0.375rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer',
                  color: 'var(--foreground)',
                }}
              >
                {copied === 'json' ? <Check size={14} /> : <ClipboardCopyIcon />}
                {copied === 'json' ? 'Copied!' : 'Copy JSON'}
              </button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function ClipboardCopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
