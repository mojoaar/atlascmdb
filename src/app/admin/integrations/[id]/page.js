'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { useFormat } from '@/components/auth/AuthProvider';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import { getConnector, getConnectorTypeLabels } from '@/lib/connectors';
import { getEntityFields } from '@/lib/form-fields';
import styles from './page.module.css';

const FIELD_LABELS = {};
['service', 'application'].forEach(et => {
  const fields = getEntityFields(et);
  fields.forEach(f => { FIELD_LABELS[f.id] = f.label || f.id; });
});

const CONFLICT_MODE_OPTIONS = [
  { value: 'merge', label: 'Merge — fill empty fields only' },
  { value: 'overwrite', label: 'Overwrite — always replace' },
  { value: 'skip', label: 'Skip — never write this field' },
];

const GLOBAL_CONFLICT_OPTIONS = [
  { value: 'merge', label: 'Merge — fill empty fields only' },
  { value: 'overwrite', label: 'Overwrite — always replace' },
  { value: 'skip', label: 'Skip — never write any fields' },
];

export default function AdminIntegrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { formatDate } = useFormat();
  const { toast, confirm } = useFeedback();

  const id = params?.id;
  const isNew = id === 'new';
  const typeFromQuery = searchParams?.get('type') || '';

  const [viewMode, setViewMode] = useState(!isNew);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const [connector, setConnector] = useState(null);
  const [connectorType, setConnectorType] = useState(typeFromQuery);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [conflictMode, setConflictMode] = useState('merge');
  const [fieldOverrides, setFieldOverrides] = useState({});

  const [syncLogs, setSyncLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);

  const mod = connectorType ? getConnector(connectorType) : null;

  const loadData = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${id}`);
      const data = await res.json();
      const c = data.data || data;
      if (c) {
        setConnector(c);
        setName(c.name || '');
        setConnectorType(c.connectorType || '');
        setBaseUrl(c.baseUrl || '');
        setApiKey(c.apiKey || '');
        setEnabled(!!c.enabled);
        setConflictMode(c.conflictMode || 'merge');
        try {
          setFieldOverrides(c.fieldOverrides ? JSON.parse(c.fieldOverrides) : {});
        } catch { setFieldOverrides({}); }
      }
    } catch {}
    setLoading(false);
  }, [id, isNew]);

  const loadLogs = useCallback(async () => {
    if (isNew) return;
    try {
      const res = await fetch(`/api/integrations/${id}/logs?limit=20`);
      const data = await res.json();
      const logs = data.data || data;
      if (Array.isArray(logs)) setSyncLogs(logs);
    } catch {}
  }, [id, isNew]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!viewMode) loadLogs();
  }, [viewMode, loadLogs]);

  async function handleSave() {
    if (!name.trim()) return toast('Name is required');
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        baseUrl: baseUrl.trim() || null,
        apiKey: apiKey || null,
        enabled,
        conflictMode,
        fieldOverrides,
      };

      if (isNew) {
        body.connectorType = connectorType;
        if (!connectorType) { toast('Select a connector type'); setSaving(false); return; }
        const res = await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        const created = data.data || data;
        if (res.ok && created.id) {
          toast('Integration created');
          router.push(`/admin/integrations/${created.id}`);
        } else {
          toast(data.error || 'Failed to create');
        }
      } else {
        const res = await fetch(`/api/integrations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast('Saved');
          setViewMode(true);
          loadData();
        } else {
          const data = await res.json();
          toast(data.error || 'Failed to save');
        }
      }
    } catch {
      toast('Save failed');
    }
    setSaving(false);
  }

  async function handleDelete() {
    const ok = await confirm(`Delete "${name}"? All sync logs will also be removed.`);
    if (!ok) return;
    await fetch(`/api/integrations/${id}`, { method: 'DELETE' });
    toast('Integration deleted');
    router.push('/admin/integrations');
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorType, baseUrl, apiKey }),
      });
      const data = await res.json();
      setTestResult(data.data || data);
    } catch {
      setTestResult({ ok: false, message: 'Request failed' });
    }
    setTesting(false);
  }

  async function handleSync() {
    setSyncLoading(true);
    try {
      const res = await fetch(`/api/integrations/${id}/sync`, { method: 'POST' });
      const data = await res.json();
      const result = data.data || data;
      if (result.status === 'success' && result.errors?.length === 0) {
        toast(`Sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);
      } else if (result.status === 'success') {
        toast(`Sync finished with errors — ${result.errored} records failed`);
      } else {
        toast('Sync failed');
      }
      loadData();
      loadLogs();
    } catch {
      toast('Sync failed');
    }
    setSyncLoading(false);
  }

  if (loading) return <div className={styles.page}><div className={styles.loading}>Loading...</div></div>;

  if (!isNew && !connector) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Integration not found.</div>
        <Button variant="secondary" onClick={() => router.push('/admin/integrations')}>Back</Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{isNew ? 'Add Integration' : name}</h1>
          {!isNew && connector && (
            <div className={styles.subtitle}>
              {mod?.label || connector.connectorType}
              {connector.lastSyncAt && <span className={styles.syncDot}> · Last synced: {formatDate(connector.lastSyncAt)}</span>}
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          {!isNew && viewMode && (
            <>
              <Button variant="primary" disabled={!enabled || syncLoading} onClick={handleSync}>
                {syncLoading ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button variant="secondary" onClick={() => setViewMode(false)}>Edit</Button>
            </>
          )}
          {!isNew && !viewMode && (
            <>
              <Button variant="primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="secondary" onClick={() => { setViewMode(true); loadData(); }}>Cancel</Button>
            </>
          )}
          {isNew && (
            <>
              <Button variant="primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Creating...' : 'Create Integration'}
              </Button>
              <Button variant="secondary" onClick={() => router.push('/admin/integrations')}>Cancel</Button>
            </>
          )}
        </div>
      </div>

      {/* Section: Connection */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Connection</div>
        <Card>
          <div className={styles.fieldGrid}>
            {isNew && (
              <div>
                <div className={styles.fieldLabel}>Connector Type</div>
                <Select
                  options={getConnectorTypeLabels()}
                  value={connectorType}
                  onChange={(e) => setConnectorType(e.target.value)}
                />
              </div>
            )}
            <div>
              <div className={styles.fieldLabel}>Name</div>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My Next Insight connection"
                readOnly={viewMode && !isNew}
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>Base URL</div>
              <Input
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://yourcompany.next-insight.com"
                readOnly={viewMode && !isNew}
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>API Key</div>
              <Input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={!isNew && connector?.apiKey && viewMode ? '••••••••••••' : 'Enter API key'}
                readOnly={viewMode && !isNew}
              />
            </div>
          </div>
          {(!isNew || (isNew && connectorType)) && !viewMode && (
            <div className={styles.testRow}>
              <Button variant="secondary" disabled={testing || !baseUrl || !apiKey} onClick={handleTestConnection}>
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              {testResult && (
                <span className={testResult.ok ? styles.testSuccess : styles.testError}>
                  {testResult.message}
                </span>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Section: Sync Settings */}
      {(!isNew || (isNew && connectorType)) && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Sync Settings</div>
          <Card>
            <div className={styles.fieldGrid}>
              <div>
                <div className={styles.fieldLabel}>Enabled</div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => setEnabled(!enabled)}
                    disabled={viewMode && !isNew}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
              <div>
                <div className={styles.fieldLabel}>Global Conflict Mode</div>
                <Select
                  options={GLOBAL_CONFLICT_OPTIONS}
                  value={conflictMode}
                  onChange={(e) => setConflictMode(e.target.value)}
                  disabled={viewMode && !isNew}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Section: Field Conflict Overrides */}
      {(!isNew || (isNew && connectorType)) && mod?.syncableEntities?.length > 0 && mod?.configurableFields && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Field Conflict Overrides</div>
          <Card>
            <div className={styles.fieldOverrideHint}>
              Per-field conflict resolution. &ldquo;Use global default&rdquo; means the setting above applies.
            </div>
            {mod.syncableEntities.filter(e => e !== 'relationship' && mod.configurableFields[e]).map(entityType => (
              <div key={entityType} className={styles.entityGroup}>
                <div className={styles.entityGroupHeader}>
                  {entityType.charAt(0).toUpperCase() + entityType.slice(1)}s
                </div>
                <div className={styles.overrideTable}>
                  <div className={styles.overrideRow + ' ' + styles.overrideHeaderRow}>
                    <div className={styles.overrideField}>Field</div>
                    <div className={styles.overrideMode}>Override</div>
                  </div>
                  {(mod.configurableFields[entityType] || []).map(field => {
                    const current = fieldOverrides[field] || '';
                    const label = FIELD_LABELS[field] || field;
                    return (
                      <div key={`${entityType}-${field}`} className={styles.overrideRow}>
                        <div className={styles.overrideField}>
                          <span className={styles.overrideFieldName}>{label}</span>
                          <span className={styles.overrideFieldKey}>{field}</span>
                        </div>
                        <div className={styles.overrideMode}>
                          <Select
                            options={[
                              { value: '', label: 'Use global default' },
                              ...CONFLICT_MODE_OPTIONS,
                            ]}
                            value={current}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldOverrides(prev => {
                                const next = { ...prev };
                                if (val === '') {
                                  delete next[field];
                                } else {
                                  next[field] = val;
                                }
                                return next;
                              });
                            }}
                            disabled={viewMode && !isNew}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Section: Sync History */}
      {!isNew && connector && !viewMode && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Sync History</div>
          <Card>
            {syncLogs.length === 0 ? (
              <div className={styles.noLogs}>No sync history yet.</div>
            ) : (
              <div className={styles.logsTable}>
                <div className={styles.logRow + ' ' + styles.logHeaderRow}>
                  <div className={styles.logCell}>Started</div>
                  <div className={styles.logCell}>Duration</div>
                  <div className={styles.logCell}>Status</div>
                  <div className={styles.logCell}>Created</div>
                  <div className={styles.logCell}>Updated</div>
                  <div className={styles.logCell}>Skipped</div>
                  <div className={styles.logCell}>Errored</div>
                </div>
                {syncLogs.map((log) => {
                  const duration = log.completedAt
                    ? Math.round((new Date(log.completedAt) - new Date(log.startedAt)) / 1000) + 's'
                    : '—';
                  return (
                    <div key={log.id} className={styles.logRow}>
                      <div className={styles.logCell}>{formatDate(log.startedAt)}</div>
                      <div className={styles.logCell}>{duration}</div>
                      <div className={styles.logCell}>
                        <span className={log.status === 'success' ? styles.statusSuccess : (log.status === 'error' ? styles.statusError : styles.statusRunning)}>
                          {log.status}
                        </span>
                      </div>
                      <div className={styles.logCell}>{log.recordsCreated}</div>
                      <div className={styles.logCell}>{log.recordsUpdated}</div>
                      <div className={styles.logCell}>{log.recordsSkipped}</div>
                      <div className={styles.logCell}>{log.recordsErrored}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Delete */}
      {!isNew && connector && !viewMode && (
        <div className={styles.section}>
          <div className={styles.sectionTitle} style={{ color: 'var(--danger)' }}>Danger Zone</div>
          <Card style={{ borderColor: 'var(--danger)', borderWidth: '2px', borderStyle: 'solid' }}>
            <p className={styles.dangerText}>
              This will permanently delete this integration and all its sync logs.
            </p>
            <Button variant="danger" onClick={handleDelete}>Delete Integration</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
