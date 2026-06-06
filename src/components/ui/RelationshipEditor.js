'use client';

import { useState, useEffect, useRef } from 'react';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import LoadingState from '@/components/ui/LoadingState';
import styles from './RelationshipEditor.module.css';
import { unwrap } from '@/lib/unwrap';
import { useFeedback } from '@/components/ui/FeedbackProvider';

const TARGET_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'application', label: 'Application' },
  { value: 'ci', label: 'CI' },
  { value: 'asset', label: 'Asset' },
];

const REL_TYPE_OPTIONS = [
  { value: 'depends_on', label: 'Depends On' },
  { value: 'hosted_on', label: 'Hosted On' },
  { value: 'owned_by', label: 'Owned By' },
  { value: 'part_of', label: 'Part Of' },
  { value: 'connects_to', label: 'Connects To' },
  { value: 'uses', label: 'Uses' },
];

const DIR_OPTIONS = [
  { value: 'outbound', label: 'Outbound' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'bidirectional', label: 'Bidirectional' },
];

export default function RelationshipEditor({ entityType, entityId }) {
  const { alert, confirm, toast } = useFeedback();
  const [rels, setRels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTargetType, setNewTargetType] = useState('service');
  const [newTargetQuery, setNewTargetQuery] = useState('');
  const [newTargetId, setNewTargetId] = useState('');
  const [newRelType, setNewRelType] = useState('');
  const [newDir, setNewDir] = useState('outbound');
  const [newNotes, setNewNotes] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const timeout = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!newTargetQuery || newTargetQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(timeout.current);
    timeout.current = setTimeout(async () => {
      const params = new URLSearchParams({ q: newTargetQuery });
      if (newTargetType) params.set('type', newTargetType);
      const res = await fetch(`/api/portal/suggest?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    }, 200);
  }, [newTargetQuery, newTargetType]);

  async function loadRelationships() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/entities/${entityType}/${entityId}/relationships`);
      if (res.ok) {
        const data = await res.json();
        const list = unwrap(data, []);
        setRels(Array.isArray(list) ? list : []);
      } else {
        setError('Failed to load relationships');
      }
    } catch {
      setError('Failed to load relationships');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadRelationships();
  }, [entityType, entityId]);

  function selectSuggestion(s) {
    setNewTargetId(s.id);
    setNewTargetQuery(s.name);
    setShowSuggestions(false);
  }

  async function handleAdd() {
    if (!newTargetId || !newRelType) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: entityType,
          sourceId: entityId,
          targetType: newTargetType,
          targetId: newTargetId,
          relationshipType: newRelType,
          direction: newDir,
          notes: newNotes || undefined,
        }),
      });
      if (res.ok) {
        setNewTargetQuery('');
        setNewTargetId('');
        setNewRelType('');
        setNewNotes('');
        await loadRelationships();
      } else {
        setError('Failed to add relationship');
      }
    } catch {
      setError('Failed to add relationship');
    }
    setSaving(false);
  }

  async function handleRemove(relId) {
    if (!await confirm('Remove this relationship?')) return;
    setError('');
    try {
      const res = await fetch(`/api/relationships/${relId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadRelationships();
      } else {
        setError('Failed to remove relationship');
      }
    } catch {
      setError('Failed to remove relationship');
    }
  }

  const columns = [
    { key: 'targetType', header: 'Target Type', width: '100px', render: (r) => (r.sourceId === entityId ? r.targetType : r.sourceType) },
    { key: 'targetName', header: 'Target Name', render: (r) => (r.sourceId === entityId ? r.targetName : r.sourceName) || '—' },
    { key: 'relationshipType', header: 'Type', width: '120px' },
    { key: 'direction', header: 'Direction', width: '100px' },
    { key: 'notes', header: 'Notes', render: (r) => r.notes || '—' },
    { key: 'actions', header: '', width: '80px', render: (r) => (
      <Button variant="danger" size="small" onClick={() => handleRemove(r.id)}>Remove</Button>
    )},
  ];

  return (
    <div className={styles.editor}>
      <div className={styles.heading}>Relationship Editor</div>

      <div className={styles.addRow}>
        <div style={{ width: 140 }}>
          <Select label="" aria-label="Target type" options={TARGET_TYPES} value={newTargetType} onChange={(e) => { setNewTargetType(e.target.value); setNewTargetId(''); setNewTargetQuery(''); }} />
        </div>
        <div className={styles.targetWrapper} ref={wrapperRef}>
          <Input
            label=""
            aria-label="Search target"
            value={newTargetQuery}
            onChange={(e) => { setNewTargetQuery(e.target.value); setNewTargetId(''); }}
            placeholder="Search target..."
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestionList}>
              {suggestions.map(s => (
                <div key={s.id} className={styles.suggestionItem} onClick={() => selectSuggestion(s)}>
                  <span className={styles.suggestionType}>{s.type}</span> {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ width: 140 }}>
          <Select label="" aria-label="Relationship type" options={REL_TYPE_OPTIONS} value={newRelType} onChange={(e) => setNewRelType(e.target.value)} />
        </div>
        <div style={{ width: 120 }}>
          <Select label="" aria-label="Direction" options={DIR_OPTIONS} value={newDir} onChange={(e) => setNewDir(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Input label="" aria-label="Notes" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes" />
        </div>
        <Button variant="primary" size="small" onClick={handleAdd} disabled={saving || !newTargetId || !newRelType}>
          {saving ? 'Adding...' : 'Add'}
        </Button>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}
      {loading && <LoadingState />}
      {!loading && rels.length === 0 && !error ? (
        <div className={styles.empty}>No relationships. Add one above.</div>
      ) : (
        <Table columns={columns} data={rels} />
      )}
    </div>
  );
}
