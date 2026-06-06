'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AuditTrail from '@/components/ui/AuditTrail';
import RelationshipEditor from '@/components/ui/RelationshipEditor';
import DetailMenu from '@/components/ui/DetailMenu';
import FormDesigner from '@/components/ui/FormDesigner';
import FormFieldRenderer from '@/components/ui/FormFieldRenderer';
import { getEntityFields, getDefaultLayout } from '@/lib/form-fields';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { unwrap } from '@/lib/unwrap';
import { useFeedback } from '@/components/ui/FeedbackProvider';

export default function AdminAssetDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({
    name: '', assetTag: '', ciId: '', ciName: '', category: '', model: '',
    status: 'in_stock', assignedTo: '', assignedToName: '', locationId: '', locationName: '',
    supplier: '', purchaseDate: '', warrantyExpiry: '', cost: '', notes: '',
  });
  const [cis, setCis] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showFormDesigner, setShowFormDesigner] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [acceptTypes, setAcceptTypes] = useState('');

  const [formLayout, setFormLayout] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    fetch('/api/cis?limit=100').then(r => r.json()).then(d => setCis(unwrap(d))).catch(() => {});
    fetch('/api/locations?limit=100').then(r => r.json()).then(d => setLocations(unwrap(d))).catch(() => {});
    fetch('/api/users?limit=100').then(r => r.json()).then(d => setUsers(unwrap(d))).catch(() => {});
    if (!isNew) {
      fetch(`/api/assets/${id}`).then(r => r.json()).then(a => {
        if (a) {
          setForm({
            name: a.name || '', assetTag: a.assetTag || '', ciId: a.ciId || '', ciName: a.ciName || '',
            category: a.category || '', model: a.model || '',
            status: a.status || 'in_stock', assignedTo: a.assignedTo || '', assignedToName: a.assignedToName || '',
            locationId: a.locationId || '', locationName: a.locationName || '', supplier: a.supplier || '',
            purchaseDate: a.purchaseDate || '', warrantyExpiry: a.warrantyExpiry || '',
            cost: a.cost || '', notes: a.notes || '',
          });
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  function loadAttachments() {
    fetch(`/api/assets/${id}/attachments`).then(r => r.json()).then(d => {
      setAttachments(unwrap(d, []));
    }).catch(() => {});
  }

  useEffect(() => {
    if (!isNew) loadAttachments();
    fetch('/api/me/theme').then(r => r.json()).then(prefs => {
      const types = prefs?.adminColumnDefaults?._attachmentTypes || '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg';
      setAcceptTypes(types.split(',').map(s => s.trim()).join(','));
    }).catch(() => {});
  }, [id, isNew]);

  useEffect(() => {
    if (loading) return;
    async function loadLayout() {
      const res = await fetch('/api/config');
      if (!res.ok) return;
      const config = await res.json();
      if (!config) return;
      const raw = config.form_layout_asset;
      if (raw) {
        try { setFormLayout(JSON.parse(raw)); } catch {}
      }
    }
    loadLayout();
  }, [isNew, loading]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/assets/${id}/attachments`, { method: 'POST', body: fd });
    if (res.ok) { loadAttachments(); e.target.value = ''; }
    setUploading(false);
  }

  async function handleDeleteAttachment(aid) {
    if (!await confirm('Delete this attachment?')) return;
    await fetch(`/api/assets/${id}/attachments/${aid}`, { method: 'DELETE' });
    loadAttachments();
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body = { ...form };
    if (body.cost) body.cost = parseFloat(body.cost);
    if (!body.ciId) body.ciId = null;
    if (!body.assignedTo) body.assignedTo = null;
    if (!body.locationId) body.locationId = null;

    const method = isNew ? 'POST' : 'PATCH';
    const url = isNew ? '/api/assets' : `/api/assets/${id}`;
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      setViewMode(true);
      setMessage({ type: 'success', text: isNew ? 'Asset created' : 'Asset saved' });
    } else {
      const err = await res.json();
      setMessage({ type: 'error', text: err.error || 'Save failed' });
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!await confirm('Delete this asset?')) return;
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/assets');
  }

  async function handleLayoutSave(layout) {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_layout_asset: JSON.stringify(layout) }),
    });
    if (res.ok) {
      setFormLayout(layout);
      setShowFormDesigner(false);
      setViewMode(true);
    } else {
      await alert('Failed to save layout');
    }
  }

  const allFields = getEntityFields('asset');
  const fieldMap = {};
  for (const f of allFields) fieldMap[f.id] = f;

  function getEffectiveLayout() {
    return formLayout || getDefaultLayout('asset');
  }

  const ciOptions = cis.map(c => ({ value: c.id, label: c.name }));
  const locationOptions = locations.map(l => ({ value: l.id, label: l.name }));
  const userOptions = users.map(u => ({ value: u.id, label: `${u.displayName} (${u.email})` }));
  const refData = { cis: ciOptions, locations: locationOptions, users: userOptions };

  function renderLayout() {
    const layout = getEffectiveLayout();
    return (
      <>
        {layout.sections.map(section => {
          if (section.visible === false) return null;
          const cols = section.columns || 1;
          const colClass = cols === 1 ? styles.gridCols1 : cols === 2 ? styles.gridCols2 : styles.gridCols3;
          const fields = section.fields.map(id => fieldMap[id]).filter(Boolean);

          return (
            <div key={section.id} className={styles.section}>
              <div className={styles.sectionTitle}>{section.title}</div>
              <Card>
                <div className={`${styles.fieldGrid} ${colClass}`}>
                  {fields.map(f => (
                    <FormFieldRenderer key={f.id} fieldDef={f} value={form[f.id]} viewMode={viewMode} onChange={(k, v) => update(k, v)} referenceData={refData} />
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
      </>
    );
  }

  function renderComponentSections() {
    const layout = getEffectiveLayout();
    const compSecs = layout.componentSections || [];

    return (
      <>
        {compSecs.map(sec => {
          if (sec.visible === false) return null;

          if (sec.id === 'attachments' && !isNew) {
            return (
              <div key={sec.id} className={styles.section}>
                <div className={styles.sectionTitle}>Attachments</div>
                <Card>
                  <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="file" onChange={handleUpload} disabled={uploading} accept={acceptTypes} style={{ fontSize: '0.8125rem' }} />
                    {uploading && <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Uploading...</span>}
                  </div>
                  {attachments.length ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.375rem 0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>File</th>
                          <th style={{ textAlign: 'right', padding: '0.375rem 0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Size</th>
                          <th style={{ textAlign: 'right', padding: '0.375rem 0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {attachments.map(a => (
                          <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.375rem 0.5rem' }}>
                              <a href={`/api/attachments/${a.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem' }}>
                                {a.filename}
                              </a>
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.375rem 0.5rem', color: 'var(--muted-foreground)' }}>
                              {a.size ? (a.size < 1024 ? `${a.size} B` : a.size < 1048576 ? `${(a.size / 1024).toFixed(1)} KB` : `${(a.size / 1048576).toFixed(1)} MB`) : '\u2014'}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.375rem 0.5rem' }}>
                              <Button variant="danger" size="small" onClick={() => handleDeleteAttachment(a.id)}>Remove</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.8125rem', textAlign: 'center' }}>No attachments</div>
                  )}
                </Card>
              </div>
            );
          }

          if (sec.id === 'relationships' && !isNew) {
            return (
              <div key={sec.id} className={styles.section}>
                <div className={styles.sectionTitle}>Relationships</div>
                <Card>
                  <RelationshipEditor entityType="asset" entityId={id} />
                </Card>
              </div>
            );
          }

          if (sec.id === 'audit_trail' && !isNew && viewMode) {
            return (
              <div key={sec.id} className={styles.section}>
                <div className={styles.sectionTitle}>Audit Trail</div>
                <Card>
                  <AuditTrail entityType="asset" entityId={id} />
                </Card>
              </div>
            );
          }

          return null;
        })}
      </>
    );
  }

  if (loading) return <LoadingState />;

  return (
    <div className={styles.detailPage}>
      <div className={styles.back}>
        <a href="/admin/assets" onClick={(e) => { e.preventDefault(); router.push('/admin/assets'); }}>&larr; Back to Assets</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {!isNew && (
              <DetailMenu
                id={id}
                entityType="asset"
                data={form}
                extraItems={[
                  { icon: <Layout size={14} />, label: 'Form Designer', onClick: () => setShowFormDesigner(true) },
                ]}
              />
            )}
            <h1 className={styles.detailTitle}>{isNew ? 'New Asset' : form.name}</h1>
          </div>
          {!isNew && <div className={styles.meta}><span>{form.category || 'Asset'}</span></div>}
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
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1rem',
          background: message.type === 'success' ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--danger) 15%, transparent)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}` }}>
          {message.text}
        </div>
      )}

      {renderLayout()}
      {renderComponentSections()}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        {isNew && <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Create Asset'}</Button>}
        {!isNew && !viewMode && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
      </div>

      {showFormDesigner && (
        <FormDesigner
          entityType="asset"
          initialLayout={getEffectiveLayout()}
          open={showFormDesigner}
          onClose={() => setShowFormDesigner(false)}
          onSave={handleLayoutSave}
        />
      )}
    </div>
  );
}
