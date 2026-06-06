'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import InlineGraph from '@/components/graph/InlineGraph';
import RelationshipEditor from '@/components/ui/RelationshipEditor';
import AuditTrail from '@/components/ui/AuditTrail';
import DetailMenu from '@/components/ui/DetailMenu';
import FormDesigner from '@/components/ui/FormDesigner';
import FormFieldRenderer from '@/components/ui/FormFieldRenderer';
import { getEntityFields, getDefaultLayout } from '@/lib/form-fields';
import styles from '@/styles/entity.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { unwrap } from '@/lib/unwrap';
import { useFeedback } from '@/components/ui/FeedbackProvider';

const CI_TYPE_OPTIONS = [
  { value: 'server', label: 'Server' },
  { value: 'network_device', label: 'Network Device' },
  { value: 'storage', label: 'Storage' },
  { value: 'database', label: 'Database' },
  { value: 'container', label: 'Container' },
  { value: 'rack', label: 'Rack' },
  { value: 'other', label: 'Other' },
];

export default function AdminCiDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({
    name: '', description: '', ownerTeamId: '', ownerTeamName: '', locationId: '', locationName: '',
    lifecycleStatus: '', environment: '', classification: '', externalRef: '',
    ciType: '', serialNumber: '', assetTag: '',
  });
  const [teams, setTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showFormDesigner, setShowFormDesigner] = useState(false);

  const [formLayout, setFormLayout] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    fetch('/api/teams?limit=100').then(r => r.json()).then(d => setTeams(unwrap(d))).catch(() => {});
    fetch('/api/locations?limit=100').then(r => r.json()).then(d => setLocations(unwrap(d))).catch(() => {});
    if (!isNew) {
      fetch(`/api/cis/${id}`).then(r => r.json()).then(c => {
        if (c) {
          setForm({
            name: c.name || '',
            description: c.description || '',
            ownerTeamId: c.ownerTeamId || '',
            ownerTeamName: c.ownerTeamName || '',
            locationId: c.locationId || '',
            locationName: c.locationName || '',
            lifecycleStatus: c.lifecycleStatus || '',
            environment: c.environment || '',
            classification: c.classification || '',
            externalRef: c.externalRef || '',
            ciType: c.ciType || '',
            serialNumber: c.serialNumber || '',
            assetTag: c.assetTag || '',
          });
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  useEffect(() => {
    if (loading) return;
    async function loadLayout() {
      const res = await fetch('/api/config');
      if (!res.ok) return;
      const config = await res.json();
      if (!config) return;
      const key = form.ciType ? `form_layout_ci:${form.ciType}` : 'form_layout_ci';
      const raw = config[key] || config.form_layout_ci;
      if (raw) {
        try { setFormLayout(JSON.parse(raw)); } catch {}
      }
    }
    loadLayout();
  }, [loading, form.ciType]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body = { ...form };
    const url = isNew ? '/api/cis' : `/api/cis/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/cis/${data.id}`);
      else { setMessage({ type: 'success', text: 'CI saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  async function handleDelete() {
    if (!await confirm('Delete this CI?')) return;
    const res = await fetch(`/api/cis/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/cis');
    else await alert('Delete failed');
  }

  async function handleLayoutSave(layout) {
    const key = form.ciType ? `form_layout_ci:${form.ciType}` : 'form_layout_ci';
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: JSON.stringify(layout) }),
    });
    if (res.ok) {
      setFormLayout(layout);
      setShowFormDesigner(false);
      setViewMode(true);
    } else {
      await alert('Failed to save layout');
    }
  }

  const allFields = getEntityFields('ci');
  const fieldMap = {};
  for (const f of allFields) fieldMap[f.id] = f;

  function getEffectiveLayout() {
    return formLayout || getDefaultLayout('ci');
  }

  const teamOptions = [ ...(teams || []).map(t => ({ value: t.id, label: t.name }))];
  const locationOptions = [ ...(locations || []).map(l => ({ value: l.id, label: l.name }))];

  const refData = { teams: teamOptions, locations: locationOptions };

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
                    <FormFieldRenderer key={f.id} fieldDef={f} value={form[f.id]} viewMode={viewMode} onChange={(key, value) => update(key, value)} referenceData={refData} />
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

          if (sec.id === 'relationships' && !isNew) {
            return (
              <div key={sec.id} className={styles.section}>
                <div className={styles.sectionTitle}>Relationships</div>
                <Card>
                  <InlineGraph entityType="ci" entityId={id} basePath="/admin" />
                  {!viewMode && <RelationshipEditor entityType="ci" entityId={id} />}
                </Card>
              </div>
            );
          }

          if (sec.id === 'audit_trail' && !isNew && viewMode) {
            return (
              <div key={sec.id} className={styles.section}>
                <div className={styles.sectionTitle}>Audit Trail</div>
                <Card>
                  <AuditTrail entityType="ci" entityId={id} />
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
        <a href="/admin/cis" onClick={(e) => { e.preventDefault(); router.push('/admin/cis'); }}>&larr; Back to CIs</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {!isNew && (
              <DetailMenu
                id={id}
                entityType="ci"
                data={form}
                extraItems={[
                  { icon: <Layout size={14} />, label: 'Form Designer', onClick: () => setShowFormDesigner(true) },
                ]}
              />
            )}
            <h1 className={styles.detailTitle}>{isNew ? 'New CI' : form.name}</h1>
          </div>
          {!isNew && <div className={styles.meta}><span>{CI_TYPE_OPTIONS.find(o => o.value === form.ciType)?.label || form.ciType || 'CI'}</span></div>}
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

      {renderLayout()}
      {renderComponentSections()}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        {isNew && <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>}
        {!isNew && !viewMode && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
      </div>

      {showFormDesigner && (
        <FormDesigner
          entityType="ci"
          initialLayout={getEffectiveLayout()}
          open={showFormDesigner}
          onClose={() => setShowFormDesigner(false)}
          onSave={handleLayoutSave}
        />
      )}
    </div>
  );
}
