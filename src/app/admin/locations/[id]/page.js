'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import MapViewer from '@/components/graph/MapViewer';
import AuditTrail from '@/components/ui/AuditTrail';
import DetailMenu from '@/components/ui/DetailMenu';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { unwrap } from '@/lib/unwrap';
import { useFeedback } from '@/components/ui/FeedbackProvider';

const LOCATION_TYPE_OPTIONS = [
  { value: 'office', label: 'Office' },
  { value: 'datacenter', label: 'Datacenter' },
  { value: 'cloud_region', label: 'Cloud Region' },
  { value: 'remote', label: 'Remote' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'store', label: 'Store' },
];

const LOCATION_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'planned', label: 'Planned' },
  { value: 'closed', label: 'Closed' },
];

export default function AdminLocationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({
    name: '', description: '', type: '', parentLocationId: '', parentLocationName: '', status: 'active', latitude: '', longitude: '',
    streetAddress: '', city: '', stateProvince: '', postalCode: '', country: '',
  });
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    fetch('/api/locations?limit=100').then(r => r.json()).then(d => setAllLocations(unwrap(d))).catch(() => {});
    if (!isNew) {
      fetch(`/api/locations/${id}`).then(r => r.json()).then(l => {
        if (l) {
          setForm({
            name: l.name || '',
            description: l.description || '',
            type: l.type || '',
            parentLocationId: l.parentLocationId || '',
            parentLocationName: l.parentLocationName || '',
            status: l.status || 'active',
            latitude: l.latitude != null ? String(l.latitude) : '',
            longitude: l.longitude != null ? String(l.longitude) : '',
            streetAddress: l.streetAddress || '',
            city: l.city || '',
            stateProvince: l.stateProvince || '',
            postalCode: l.postalCode || '',
            country: l.country || '',
          });
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body = { ...form };
    const url = isNew ? '/api/locations' : `/api/locations/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/locations/${data.id}`);
      else { setMessage({ type: 'success', text: 'Location saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  async function handleDelete() {
    if (!await confirm('Delete this location?')) return;
    const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/locations');
    else await alert('Delete failed');
  }

  const parentOptions = [...(allLocations || []).filter(l => l.id !== id).map(l => ({ value: l.id, label: l.name }))];

  if (loading) return <LoadingState />;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/admin/locations" onClick={(e) => { e.preventDefault(); router.push('/admin/locations'); }}>&larr; Back to Locations</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {!isNew && <DetailMenu id={id} entityType="location" data={form} />}
            <h1 className={styles.detailTitle}>{isNew ? 'New Location' : form.name}</h1>
          </div>
          {!isNew && <div className={styles.meta}><span>{LOCATION_TYPE_OPTIONS.find(o => o.value === form.type)?.label || form.type || 'Location'}</span></div>}
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
        <div className={styles.sectionTitle}>General</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Name</div>
                <div className={styles.fieldValue}>{form.name || '—'}</div>
              </div>
            ) : (
              <Input label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            )}
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Description</div>
                <div className={styles.fieldValue}>{form.description || '—'}</div>
              </div>
            ) : (
              <Input label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Type</div>
                  <div className={styles.fieldValue}>{LOCATION_TYPE_OPTIONS.find(o => o.value === form.type)?.label || form.type || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Select label="Type" options={LOCATION_TYPE_OPTIONS} value={form.type} onChange={(e) => update('type', e.target.value)} /></div>
              )}
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Status</div>
                  <div className={styles.fieldValue}>{LOCATION_STATUS_OPTIONS.find(o => o.value === form.status)?.label || form.status || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Select label="Status" options={LOCATION_STATUS_OPTIONS} value={form.status} onChange={(e) => update('status', e.target.value)} /></div>
              )}
            </div>
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Parent Location</div>
                <div className={styles.fieldValue}>{parentOptions.find(o => o.value === form.parentLocationId)?.label || form.parentLocationId || '—'}</div>
              </div>
            ) : (
              <Select label="Parent Location" options={parentOptions} value={form.parentLocationId} onChange={(e) => update('parentLocationId', e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Latitude</div>
                  <div className={styles.fieldValue}>{form.latitude || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Input label="Latitude" type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="e.g. 56.1629" /></div>
              )}
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Longitude</div>
                  <div className={styles.fieldValue}>{form.longitude || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Input label="Longitude" type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="e.g. 10.2039" /></div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Address</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {viewMode ? (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Street Address</div>
                <div className={styles.fieldValue}>{form.streetAddress || '—'}</div>
              </div>
            ) : (
              <Input label="Street Address" value={form.streetAddress} onChange={(e) => update('streetAddress', e.target.value)} placeholder="e.g. Søren Nymarks Vej 15" />
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Postal Code</div>
                  <div className={styles.fieldValue}>{form.postalCode || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Input label="Postal Code" value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} placeholder="e.g. 8220" /></div>
              )}
              {viewMode ? (
                <div style={{ flex: 2 }} className={styles.field}>
                  <div className={styles.fieldLabel}>City</div>
                  <div className={styles.fieldValue}>{form.city || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 2 }}><Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="e.g. Brabrand" /></div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>State/Province</div>
                  <div className={styles.fieldValue}>{form.stateProvince || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Input label="State/Province" value={form.stateProvince} onChange={(e) => update('stateProvince', e.target.value)} placeholder="e.g. Midtjylland" /></div>
              )}
              {viewMode ? (
                <div style={{ flex: 1 }} className={styles.field}>
                  <div className={styles.fieldLabel}>Country</div>
                  <div className={styles.fieldValue}>{form.country || '—'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }}><Input label="Country" value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="e.g. Denmark" /></div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        {isNew && <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>}
        {!isNew && !viewMode && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
      </div>

      {!isNew && !isNaN(parseFloat(form.latitude)) && isFinite(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude)) && isFinite(parseFloat(form.longitude)) && (
        <div className={styles.section} style={{ marginTop: '1.5rem' }}>
          <div className={styles.sectionTitle}>Location</div>
          <Card>
            <MapViewer
              markers={[{ id, name: form.name, type: form.type, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) }]}
              center={[parseFloat(form.latitude), parseFloat(form.longitude)]}
              zoom={13}
              height={300}
              compact
            />
          </Card>
        </div>
      )}

      {!isNew && viewMode && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Audit Trail</div>
          <Card>
            <AuditTrail entityType="location" entityId={id} />
          </Card>
        </div>
      )}
    </div>
  );
}
