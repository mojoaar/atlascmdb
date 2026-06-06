'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
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

export default function AdminServiceDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();
  const isNew = id === 'new';
  const [viewMode, setViewMode] = useState(id !== 'new');

  const [form, setForm] = useState({
    name: '', description: '', ownerTeamId: '', ownerTeamName: '',
    lifecycleStatus: '', environment: '', classification: '',
    type: 'business',
    businessCriticality: '', businessOwner: '', serviceTier: '',
    supportModel: '', serviceCategory: '',
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showFormDesigner, setShowFormDesigner] = useState(false);

  const [formLayout, setFormLayout] = useState(null);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    fetch('/api/teams?limit=100').then(r => r.json()).then(d => setTeams(unwrap(d)));
    if (!isNew) {
      fetch(`/api/services/${id}`).then(r => r.json()).then(s => {
        if (s) {
          setForm({
            name: s.name || '',
            description: s.description || '',
            ownerTeamId: s.ownerTeamId || '',
            ownerTeamName: s.ownerTeamName || '',
            lifecycleStatus: s.lifecycleStatus || '',
            environment: s.environment || '',
            classification: s.classification || '',
            type: s.type || 'business',
            businessCriticality: s.typeSpecific?.businessCriticality || '',
            businessOwner: s.typeSpecific?.businessOwner || '',
            serviceTier: s.typeSpecific?.serviceTier || '',
            supportModel: s.typeSpecific?.supportModel || '',
            serviceCategory: s.typeSpecific?.serviceCategory || '',
          });
        }
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
      const raw = config.form_layout_service;
      if (raw) {
        try { setFormLayout(JSON.parse(raw)); } catch {}
      }
    }
    loadLayout();
  }, [isNew, loading]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body = {
      name: form.name,
      description: form.description,
      ownerTeamId: form.ownerTeamId || null,
      lifecycleStatus: form.lifecycleStatus || null,
      environment: form.environment || null,
      classification: form.classification || null,
      typeFields: form.type === 'business'
        ? { businessCriticality: form.businessCriticality || null, businessOwner: form.businessOwner || null, serviceTier: form.serviceTier || null }
        : { supportModel: form.supportModel || null, serviceCategory: form.serviceCategory || null },
    };

    const url = isNew ? '/api/services' : `/api/services/${id}`;
    const method = isNew ? 'POST' : 'PATCH';
    if (isNew) body.type = form.type;

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) router.push(`/admin/services/${data.id}`);
      else { setMessage({ type: 'success', text: 'Service saved' }); setViewMode(true); }
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' });
    }
  }

  async function handleDelete() {
    if (!await confirm('Delete this service?')) return;
    const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/services');
    else await alert('Delete failed');
  }

  async function handleLayoutSave(layout) {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_layout_service: JSON.stringify(layout) }),
    });
    if (res.ok) {
      setFormLayout(layout);
      setShowFormDesigner(false);
      setViewMode(true);
    } else {
      await alert('Failed to save layout');
    }
  }

  const allFields = getEntityFields('service');
  const fieldMap = {};
  for (const f of allFields) fieldMap[f.id] = f;

  function getEffectiveLayout() {
    return formLayout || getDefaultLayout('service');
  }

  const teamOptions = [...(teams || []).map(t => ({ value: t.id, label: t.name }))];
  const refData = { teams: teamOptions };

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

          if (sec.id === 'relationships' && !isNew) {
            return (
              <div key={sec.id} className={styles.section}>
                <div className={styles.sectionTitle}>Relationships</div>
                <Card>
                  <InlineGraph entityType="service" entityId={id} basePath="/admin" />
                  {!viewMode && <RelationshipEditor entityType="service" entityId={id} />}
                </Card>
              </div>
            );
          }

          if (sec.id === 'audit_trail' && !isNew && viewMode) {
            return (
              <div key={sec.id} className={styles.section}>
                <div className={styles.sectionTitle}>Audit Trail</div>
                <Card>
                  <AuditTrail entityType="service" entityId={id} />
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
        <a href="/admin/services" onClick={(e) => { e.preventDefault(); router.push('/admin/services'); }}>&larr; Back to Services</a>
      </div>
      <div className={styles.detailHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {!isNew && (
              <DetailMenu
                id={id}
                entityType="service"
                data={form}
                extraItems={[
                  { icon: <Layout size={14} />, label: 'Form Designer', onClick: () => setShowFormDesigner(true) },
                ]}
              />
            )}
            <h1 className={styles.detailTitle}>{isNew ? 'New Service' : form.name}</h1>
          </div>
          {!isNew && <div className={styles.meta}><span>{form.type === 'business' ? 'Business Service' : 'Technical Service'}</span></div>}
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
        <div className={styles.sectionTitle}>Type</div>
        <Card>
          {isNew && !viewMode ? (
            <div style={{ maxWidth: 300 }}>
              <Select
                label="Type"
                options={[{ value: 'business', label: 'Business' }, { value: 'technical', label: 'Technical' }]}
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
              />
            </div>
          ) : (
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Type</div>
              <div className={styles.fieldValue}>{form.type === 'business' ? 'Business Service' : 'Technical Service'}</div>
            </div>
          )}
        </Card>
      </div>

      {renderLayout()}
      {renderComponentSections()}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        {isNew && <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>}
        {!isNew && !viewMode && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
      </div>

      {showFormDesigner && (
        <FormDesigner
          entityType="service"
          initialLayout={getEffectiveLayout()}
          open={showFormDesigner}
          onClose={() => setShowFormDesigner(false)}
          onSave={handleLayoutSave}
        />
      )}
    </div>
  );
}
