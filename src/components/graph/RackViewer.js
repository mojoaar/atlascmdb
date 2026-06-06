'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import LoadingState from '@/components/ui/LoadingState';
import { useAuth } from '@/components/auth/AuthProvider';
import styles from './RackViewer.module.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function RackViewer({ rackId, rackSize, rackName, locationName }) {
  const { user } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('front');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [assignCiId, setAssignCiId] = useState('');
  const [assignStartU, setAssignStartU] = useState('');
  const [assignOccupied, setAssignOccupied] = useState('1');
  const [assignPosition, setAssignPosition] = useState('front');
  const [assignLabel, setAssignLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    fetch(`/api/portal/suggest?q=${encodeURIComponent(debouncedSearch)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          const cidata = (data.data || data).filter(d => d.entityType === 'ci');
          setSearchResults(cidata);
          setSearching(false);
        }
      })
      .catch(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const loadPlacements = useCallback(async () => {
    try {
      const res = await fetch(`/api/cis/${rackId}/rack-placements`);
      if (res.ok) {
        const result = await res.json();
        setPlacements(result.data || result);
      }
    } catch (e) {
      setError('Failed to load placements');
    } finally {
      setLoading(false);
    }
  }, [rackId]);

  useEffect(() => { loadPlacements(); }, [loadPlacements]);

  function openAssignModal(slotU) {
    setEditingPlacement(null);
    setSelectedSlot(slotU);
    setAssignCiId('');
    setAssignStartU(String(slotU));
    setAssignOccupied('1');
    setAssignPosition(view);
    setAssignLabel('');
    setSaveError(null);
    setSearchTerm('');
    setSearchResults([]);
    setModalOpen(true);
  }

  function openEditModal(placement) {
    setEditingPlacement(placement);
    setSelectedSlot(null);
    setAssignCiId(placement.ciId);
    setAssignStartU(String(placement.startU));
    setAssignOccupied(String(placement.occupiedUs || 1));
    setAssignPosition(placement.position || 'front');
    setAssignLabel(placement.label || '');
    setSaveError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      if (editingPlacement) {
        const res = await fetch(`/api/cis/${rackId}/rack-placements`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPlacement.id,
            startU: parseInt(assignStartU),
            occupiedUs: parseInt(assignOccupied),
            position: assignPosition,
            label: assignLabel || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update placement');
        }
      } else {
        const res = await fetch(`/api/cis/${rackId}/rack-placements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ciId: assignCiId,
            startU: parseInt(assignStartU),
            occupiedUs: parseInt(assignOccupied),
            position: assignPosition,
            label: assignLabel || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create placement');
        }
      }
      setModalOpen(false);
      await loadPlacements();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingPlacement) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cis/${rackId}/rack-placements`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPlacement.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setModalOpen(false);
      await loadPlacements();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredPlacements = placements.filter(p => (p.position || 'front') === view);

  const rows = [];
  for (let u = (rackSize || 42); u >= 1; u--) {
    const placement = filteredPlacements.find(p => p.startU <= u && u < p.startU + (p.occupiedUs || 1));
    rows.push({ u, placement });
  }

  if (loading) return <div className={styles.wrap}><LoadingState /></div>;
  if (error) return <div className={styles.wrap}><p className={styles.error}>{error}</p></div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${view === 'front' ? styles.active : ''}`}
            onClick={() => setView('front')}
          >
            Front
          </button>
          <button
            className={`${styles.toggleBtn} ${view === 'back' ? styles.active : ''}`}
            onClick={() => setView('back')}
          >
            Back
          </button>
        </div>
        <span className={styles.legend}>
          {locationName && <span className={styles.locationTag}>{locationName}</span>}{' '}
          {view} view · {filteredPlacements.length} placements
        </span>
      </div>

      <div className={styles.rack} style={{ '--rack-size': rackSize || 42 }}>
        {rows.map(({ u, placement }) => {
          const isFirst = placement && placement.startU === u;
          const span = placement ? (placement.occupiedUs || 1) : 1;

          if (placement && !isFirst) return null;

          return (
            <div
              key={u}
              className={`${styles.slot} ${placement ? styles.occupied : styles.empty}`}
              style={placement ? { gridRow: `${(rackSize || 42) - (placement.startU + span - 1) + 1} / span ${span}` } : {}}
              onClick={() => {
                if (placement) {
                  openEditModal(placement);
                } else {
                  openAssignModal(u);
                }
              }}
            >
              <span className={styles.slotNumber}>{placement ? `${placement.startU}-${placement.startU + span - 1}` : u}</span>
              {placement ? (
                <div className={styles.placementInfo}>
                  <span className={styles.placementName}>{placement.ciName || placement.ciId}</span>
                  {placement.ciType && (
                    <span className={`${styles.ciTypeBadge} ${styles[placement.ciType] || ''}`}>
                      {placement.ciType}
                    </span>
                  )}
                  {placement.label && <span className={styles.placementLabel}>{placement.label}</span>}
                  {placement.ciSerialNumber && <span className={styles.placementSerial}>{placement.ciSerialNumber}</span>}
                </div>
              ) : (
                <div className={styles.emptyHint}>Empty</div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingPlacement ? 'Edit Placement' : `Assign CI — U${selectedSlot}`}>
        <div className={styles.modalBody}>
          {!editingPlacement && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Search CI</label>
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
              />
              {searching && <span className={styles.searching}>Searching...</span>}
              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.map(r => (
                    <div
                      key={r.id}
                      className={`${styles.searchItem} ${assignCiId === r.id ? styles.selected : ''}`}
                      onClick={() => { setAssignCiId(r.id); setSearchTerm(r.name); setSearchResults([]); }}
                    >
                      <span className={styles.searchName}>{r.name}</span>
                      <span className={styles.searchType}>{r.entityType}</span>
                    </div>
                  ))}
                </div>
              )}
              {!searching && debouncedSearch.length >= 2 && searchResults.length === 0 && (
                <span className={styles.noResults}>No CIs found</span>
              )}
              {assignCiId && (
                <div className={styles.selectedCi}>
                  Selected CI: {assignCiId}
                </div>
              )}
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Start U</label>
              <Input
                type="number"
                min={1}
                max={rackSize || 42}
                value={assignStartU}
                onChange={e => setAssignStartU(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Occupied U</label>
              <Input
                type="number"
                min={1}
                max={rackSize || 42}
                value={assignOccupied}
                onChange={e => setAssignOccupied(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Position</label>
            <Select
              value={assignPosition}
              onChange={e => setAssignPosition(e.target.value)}
              options={[
                { value: 'front', label: 'Front' },
                { value: 'back', label: 'Back' },
              ]}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Label (optional)</label>
            <Input
              value={assignLabel}
              onChange={e => setAssignLabel(e.target.value)}
              placeholder="e.g. Patch Panel"
            />
          </div>

          {saveError && <p className={styles.saveError}>{saveError}</p>}

          <div className={styles.modalActions}>
            {editingPlacement && (
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? '...' : 'Remove'}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingPlacement ? 'Update' : 'Place'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
