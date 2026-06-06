'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

export default function RackViewer({ rackId, rackSize = 42, rackName, locationName, fullScreen = false }) {
  const router = useRouter();
  const { user } = useAuth();
  const UNIT_H = fullScreen ? 24 : 20;
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [hoveredPlacement, setHoveredPlacement] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

  function openAssignModal(slotU, side) {
    setEditingPlacement(null);
    setSelectedSlot(slotU);
    setAssignCiId('');
    setAssignStartU(String(slotU));
    setAssignOccupied('1');
    setAssignPosition(side);
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

  function handleMouseMove(e) {
    if (hoveredPlacement) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  }

  function renderRackColumn(sidePlacements, side) {
    const size = rackSize || 42;
    const occupiedUs = new Set();
    sidePlacements.forEach(p => {
      for (let u = p.startU; u < p.startU + (p.occupiedUs || 1); u++) {
        occupiedUs.add(u);
      }
    });

    return (
      <div className={styles.rackColumn} style={{ '--rack-size': size, '--unit-height': `${UNIT_H}px` }}>
        {/* Clickable empty zones */}
        {Array.from({ length: size }, (_, i) => size - i).map(u =>
          occupiedUs.has(u) ? null : (
            <div
              key={`e-${u}`}
              className={styles.rackEmptyZone}
              style={{
                top: (size - u) * UNIT_H,
                height: UNIT_H - 1,
              }}
              onClick={() => openAssignModal(u, side)}
            />
          )
        )}

        {/* Occupied units */}
        {sidePlacements.map(p => {
          const span = p.occupiedUs || 1;
          const top = (size - p.startU - span + 1) * UNIT_H;
          const height = span * UNIT_H - 1;

          return (
            <div
              key={p.id}
              className={`${styles.rackSlot} ${styles[p.ciType] || styles.rackSlotDefault}`}
              style={{
                top,
                height,
              }}
              onClick={() => openEditModal(p)}
              onMouseEnter={e => {
                setHoveredPlacement(p);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPlacement(null)}
            >
              <div className={styles.slotContent}>
                <span className={styles.slotName}>{p.ciName || p.ciId}</span>
                {p.ciType && (
                  <span className={`${styles.slotTypeBadge} ${styles[p.ciType] || ''}`}>
                    {p.ciType.replace('_', ' ')}
                  </span>
                )}
                {p.label && <span className={styles.slotLabel}>{p.label}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (loading) return <div className={styles.wrap}><LoadingState /></div>;
  if (error) return <div className={styles.wrap}><p className={styles.error}>{error}</p></div>;

  const size = rackSize || 42;
  const frontPlacements = placements.filter(p => (p.position || 'front') === 'front');
  const backPlacements = placements.filter(p => p.position === 'back');

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.legend}>
          {locationName && <span className={styles.locationTag}>{locationName}</span>}{' '}
          {placements.length} placement{placements.length !== 1 ? 's' : ''} · {size}U
        </span>
      </div>

      <div className={`${styles.rackOuter} ${fullScreen ? styles.fullScreen : ''}`} style={{ '--rack-size': size, '--unit-height': `${UNIT_H}px` }}>
        {/* Row 1: Headers */}
        <div className={styles.rackSideLabel}>Front</div>
        <div className={styles.uLabelSpacer} />
        <div className={styles.rackSideLabel}>Rear</div>

        {/* Row 2: Columns (Auto-flow places these in row 2) */}
        {renderRackColumn(frontPlacements, 'front')}

        <div className={styles.uNumbers}>
          {Array.from({ length: size }, (_, i) => size - i).map(u => {
            const isMilestone = u % 10 === 0 || u === 1 || u === size;
            return (
              <div
                key={u}
                className={`${styles.uNumber} ${isMilestone ? styles.uNumberMilestone : ''}`}
              >
                {u}
              </div>
            );
          })}
        </div>

        {renderRackColumn(backPlacements, 'back')}
      </div>

      {!fullScreen && (
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <a
            href={`/admin/racks/${rackId}/layout`}
            onClick={(e) => { e.preventDefault(); router.push(`/admin/racks/${rackId}/layout`); }}
            style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
          >
            View Full Rack Layout &rarr;
          </a>
        </div>
      )}

      {/* Floating tooltip */}
      {hoveredPlacement && (
        <div
          className={styles.slotTooltip}
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y - 10,
          }}
        >
          <div className={styles.tooltipName}>{hoveredPlacement.ciName || hoveredPlacement.ciId}</div>
          <div className={styles.tooltipGrid}>
            <span className={styles.tooltipLabel}>Type:</span>
            <span className={styles.tooltipValue}>{hoveredPlacement.ciType ? hoveredPlacement.ciType.replace('_', ' ') : 'CI'}</span>

            {hoveredPlacement.ciSerialNumber && (
              <>
                <span className={styles.tooltipLabel}>S/N:</span>
                <span className={styles.tooltipValue}>{hoveredPlacement.ciSerialNumber}</span>
              </>
            )}

            {hoveredPlacement.label && (
              <>
                <span className={styles.tooltipLabel}>Label:</span>
                <span className={styles.tooltipValue}>{hoveredPlacement.label}</span>
              </>
            )}

            <span className={styles.tooltipLabel}>Position:</span>
            <span className={styles.tooltipValue}>
              U{hoveredPlacement.startU}–U{hoveredPlacement.startU + (hoveredPlacement.occupiedUs || 1) - 1} ({hoveredPlacement.occupiedUs || 1}U, {hoveredPlacement.position || 'front'})
            </span>
          </div>
        </div>
      )}

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
