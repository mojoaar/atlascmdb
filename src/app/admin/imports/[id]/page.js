'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';

export default function AdminImportDetail() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({ name: '', sourceType: 'csv' });
  const [importSet, setImportSet] = useState(null);
  const [message, setMessage] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/import-sets/${id}`).then(r => r.json()).then(s => {
        setImportSet(s);
        setForm({ name: s.name || '', sourceType: s.sourceType || 'csv' });
        setLoading(false);
      });
    }
  }, [id, isNew]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const url = isNew ? '/api/import-sets' : `/api/import-sets/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/imports/${data.id}`);
      else { setMessage({ type: 'success', text: 'Import set saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  if (loading) return <LoadingState />;

  const rowColumns = [
    { key: 'rowNumber', header: '#' },
    { key: 'validationStatus', header: 'Status', render: (r) => <Badge variant={r.validationStatus === 'valid' ? 'success' : r.validationStatus === 'error' ? 'danger' : 'default'}>{r.validationStatus}</Badge> },
    { key: 'sourceData', header: 'Source', render: (r) => { try { return JSON.stringify(JSON.parse(r.sourceData)).substring(0, 60); } catch { return String(r.sourceData).substring(0, 60); } } },
    { key: 'destinationRecordId', header: 'Dest. Record', render: (r) => r.destinationRecordId || '—' },
  ];

  const mappingColumns = [
    { key: 'sourceField', header: 'Source Field' },
    { key: 'targetField', header: 'Target Field' },
    { key: 'required', header: 'Required', render: (r) => r.required ? 'Yes' : 'No' },
  ];

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/admin/imports" onClick={(e) => { e.preventDefault(); router.push('/admin/imports'); }}>&larr; Back to Imports</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className={styles.detailTitle}>{isNew ? 'New Import Set' : importSet?.name}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isNew && viewMode && (
            <Button variant="primary" onClick={() => setViewMode(false)}>Edit</Button>
          )}
          {(!isNew && !viewMode) && (
            <>
              <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              <Button variant="secondary" onClick={() => { setViewMode(true); }}>Cancel</Button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.8125rem',
          background: message.type === 'success' ? 'var(--success)' : 'var(--danger)', color: '#fff' }}>
          {message.text}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Details</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Name</div><div className={styles.fieldValue}>{form.name || '—'}</div></div>
            ) : (
              <Input label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Source Type</div><div className={styles.fieldValue}>{[{ value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' }, { value: 'api', label: 'API' }].find(o => o.value === form.sourceType)?.label || form.sourceType || '—'}</div></div>
            ) : (
              <Select
                label="Source Type"
                options={[{ value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' }, { value: 'api', label: 'API' }]}
                value={form.sourceType}
                onChange={(e) => update('sourceType', e.target.value)}
              />
            )}
          </div>
        </Card>
      </div>

      {importSet && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Mappings ({importSet.mappings?.length || 0})</div>
            <Table columns={mappingColumns} data={importSet.mappings || []} />
          </div>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Rows ({importSet.rows?.length || 0})</div>
            <Table columns={rowColumns} data={importSet.rows || []} />
          </div>
        </>
      )}

      {(!viewMode) && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      )}
    </div>
  );
}
