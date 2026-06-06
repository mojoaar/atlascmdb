'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DetailMenu from '@/components/ui/DetailMenu';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { useFeedback } from '@/components/ui/FeedbackProvider';

const ENTITY_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'application', label: 'Application' },
  { value: 'ci', label: 'CI' },
  { value: 'team', label: 'Team' },
  { value: 'location', label: 'Location' },
];

const RELATIONSHIP_TYPE_OPTIONS = [
  { value: 'depends_on', label: 'Depends On' },
  { value: 'hosted_on', label: 'Hosted On' },
  { value: 'owned_by', label: 'Owned By' },
  { value: 'part_of', label: 'Part Of' },
  { value: 'connects_to', label: 'Connects To' },
  { value: 'uses', label: 'Uses' },
];

const DIRECTION_OPTIONS = [
  { value: 'outbound', label: 'Outbound' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'bidirectional', label: 'Bidirectional' },
];

export default function AdminRelationshipDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({
    sourceType: '', sourceId: '', targetType: '', targetId: '', relationshipType: '', direction: '', notes: '',
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/relationships/${id}`).then(r => r.json()).then(rel => {
        if (rel) {
          setForm({
            sourceType: rel.sourceType || '',
            sourceId: rel.sourceId || '',
            targetType: rel.targetType || '',
            targetId: rel.targetId || '',
            relationshipType: rel.relationshipType || '',
            direction: rel.direction || '',
            notes: rel.notes || '',
          });
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body = { ...form };
    const url = isNew ? '/api/relationships' : `/api/relationships/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/relationships/${data.id}`);
      else { setMessage({ type: 'success', text: 'Relationship saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  async function handleDelete() {
    if (!await confirm('Delete this relationship?')) return;
    const res = await fetch(`/api/relationships/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/relationships');
    else await alert('Delete failed');
  }

  if (loading) return <LoadingState />;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/admin/relationships" onClick={(e) => { e.preventDefault(); router.push('/admin/relationships'); }}>&larr; Back to Relationships</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {!isNew && <DetailMenu id={id} entityType="relationship" data={form} />}
          <h1 className={styles.detailTitle}>{isNew ? 'New Relationship' : `Relationship ${id}`}</h1>
        </div>
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
        <div className={styles.sectionTitle}>Relationship</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                {viewMode ? (
                  <div className={styles.field}><div className={styles.fieldLabel}>Source Type</div><div className={styles.fieldValue}>{ENTITY_TYPES.find(o => o.value === form.sourceType)?.label || form.sourceType || '—'}</div></div>
                ) : (
                  <Select label="Source Type" options={ENTITY_TYPES} value={form.sourceType} onChange={(e) => update('sourceType', e.target.value)} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                {viewMode ? (
                  <div className={styles.field}><div className={styles.fieldLabel}>Source ID</div><div className={styles.fieldValue}>{form.sourceId || '—'}</div></div>
                ) : (
                  <Input label="Source ID" value={form.sourceId} onChange={(e) => update('sourceId', e.target.value)} />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                {viewMode ? (
                  <div className={styles.field}><div className={styles.fieldLabel}>Target Type</div><div className={styles.fieldValue}>{ENTITY_TYPES.find(o => o.value === form.targetType)?.label || form.targetType || '—'}</div></div>
                ) : (
                  <Select label="Target Type" options={ENTITY_TYPES} value={form.targetType} onChange={(e) => update('targetType', e.target.value)} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                {viewMode ? (
                  <div className={styles.field}><div className={styles.fieldLabel}>Target ID</div><div className={styles.fieldValue}>{form.targetId || '—'}</div></div>
                ) : (
                  <Input label="Target ID" value={form.targetId} onChange={(e) => update('targetId', e.target.value)} />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                {viewMode ? (
                  <div className={styles.field}><div className={styles.fieldLabel}>Relationship Type</div><div className={styles.fieldValue}>{RELATIONSHIP_TYPE_OPTIONS.find(o => o.value === form.relationshipType)?.label || form.relationshipType || '—'}</div></div>
                ) : (
                  <Select label="Relationship Type" options={RELATIONSHIP_TYPE_OPTIONS} value={form.relationshipType} onChange={(e) => update('relationshipType', e.target.value)} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                {viewMode ? (
                  <div className={styles.field}><div className={styles.fieldLabel}>Direction</div><div className={styles.fieldValue}>{DIRECTION_OPTIONS.find(o => o.value === form.direction)?.label || form.direction || '—'}</div></div>
                ) : (
                  <Select label="Direction" options={DIRECTION_OPTIONS} value={form.direction} onChange={(e) => update('direction', e.target.value)} />
                )}
              </div>
            </div>
            {viewMode ? (
              <div className={styles.field}><div className={styles.fieldLabel}>Notes</div><div className={styles.fieldValue}>{form.notes || '—'}</div></div>
            ) : (
              <Input label="Notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            )}
          </div>
        </Card>
      </div>

      {(!isNew && !viewMode) && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          {!isNew && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
        </div>
      )}
    </div>
  );
}
