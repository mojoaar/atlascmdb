'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Plug2, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { useFormat } from '@/components/auth/AuthProvider';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import { listConnectors } from '@/lib/connectors';
import styles from './page.module.css';

const COMING_SOON = [
  { type: 'servicenow',  logoInitials: 'SN',  label: 'ServiceNow',            desc: 'ITSM and service catalog mapping' },
  { type: 'netbox',      logoInitials: 'NB',  label: 'NetBox',                desc: 'DCIM and IPAM physical hardware' },
  { type: 'azure',       logoInitials: 'AZ',  label: 'Microsoft Azure',       desc: 'Cloud resources and inventory' },
  { type: 'gcp',         logoInitials: 'GCP', label: 'Google Cloud Platform', desc: 'Cloud virtual instances' },
  { type: 'proxmox',     logoInitials: 'PX',  label: 'Proxmox',               desc: 'Hypervisor host clustering' },
  { type: 'vcenter',     logoInitials: 'VC',  label: 'VMware vCenter',        desc: 'VM and hypervisor inventory' },
  { type: 'hyperv',      logoInitials: 'HV',  label: 'Microsoft Hyper-V',     desc: 'Windows virtual infrastructure' },
];

export default function AdminIntegrationsPage() {
  const router = useRouter();
  const { formatDate } = useFormat();
  const { toast, confirm } = useFeedback();
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [oidcIssuerUrl, setOidcIssuerUrl] = useState('');
  const [oidcClientId, setOidcClientId] = useState('');
  const [oidcClientSecret, setOidcClientSecret] = useState('');
  const [scimEnabled, setScimEnabled] = useState(false);
  const [scimToken, setScimToken] = useState('');

  useEffect(() => {
    loadConnectors();
    loadAuthConfig();
  }, []);

  async function loadConnectors() {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      if (data.data) setConnectors(data.data);
    } catch {}
    setLoading(false);
  }

  async function loadAuthConfig() {
    try {
      const res = await fetch('/api/config');
      const c = await res.json();
      if (c && !c.error) {
        setSsoEnabled(c.sso_enabled === 'true');
        setOidcIssuerUrl(c.oidc_issuer_url || '');
        setOidcClientId(c.oidc_client_id || '');
        setOidcClientSecret('');
        setScimEnabled(c.scim_enabled === 'true');
        setScimToken(c.scim_bearer_token_masked || '');
      }
    } catch {}
  }

  async function handleToggleEnabled(c) {
    await fetch(`/api/integrations/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !c.enabled }),
    });
    loadConnectors();
    toast(`${c.name} ${c.enabled ? 'disabled' : 'enabled'}`);
  }

  async function handleSync(c) {
    setSyncingId(c.id);
    try {
      const res = await fetch(`/api/integrations/${c.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success' && data.errors?.length === 0) {
        toast(`Sync complete: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped`);
      } else if (data.status === 'success') {
        toast(`Sync finished with errors — ${data.errored} records failed`);
      } else {
        toast('Sync failed');
      }
      loadConnectors();
    } catch {
      toast('Sync failed');
    }
    setSyncingId(null);
  }

  async function handleDelete(c) {
    const ok = await confirm(`Delete "${c.name}"? This will also remove all sync logs for this connector.`);
    if (!ok) return;
    await fetch(`/api/integrations/${c.id}`, { method: 'DELETE' });
    loadConnectors();
    toast(`${c.name} deleted`);
  }

  async function handleSaveSso() {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sso_enabled: ssoEnabled ? 'true' : 'false',
        oidc_issuer_url: oidcIssuerUrl,
        oidc_client_id: oidcClientId,
        ...(oidcClientSecret ? { oidc_client_secret: oidcClientSecret } : {}),
      }),
    });
    toast('SSO settings saved');
  }

  async function handleSaveScim() {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scim_enabled: scimEnabled ? 'true' : 'false' }),
    });
    toast('SCIM settings saved');
  }

  async function handleRegenerateToken() {
    const newToken = crypto.randomUUID();
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scim_bearer_token: newToken }),
    });
    setScimToken(newToken.slice(0, 8) + '••••••••••••');
    toast('Token regenerated. It has been copied to your clipboard.');
    navigator.clipboard.writeText(newToken);
  }

  function statusBadge(c) {
    if (!c.lastSyncStatus) return <span className={styles.statusNever}>Never synced</span>;
    if (c.lastSyncStatus === 'success') return <span className={styles.statusSuccess}>Success</span>;
    return <span className={styles.statusError}>Error</span>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Integrations</h1>
        <Button variant="primary" onClick={() => setShowTypePicker(true)}>
          <Plus size={16} /> Add Integration
        </Button>
      </div>

      <div className={styles.connectorLabel}>Data Connectors</div>

      {loading && <div className={styles.loading}>Loading...</div>}

      <div className={styles.grid}>
        {connectors.map((c) => (
          <Card key={c.id} className={styles.connectorCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardLogo}>
                {(listConnectors().find(m => m.type === c.connectorType)?.logoInitials) || c.connectorType.slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.cardMain}>
                <div className={styles.cardName}>{c.name}</div>
                <div className={styles.cardType}>
                  <Plug2 size={12} />
                  {listConnectors().find(m => m.type === c.connectorType)?.label || c.connectorType}
                </div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={!!c.enabled}
                  onChange={() => handleToggleEnabled(c)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.syncStatus}>
                {statusBadge(c)}
                {c.lastSyncAt && (
                  <span className={styles.syncTime}>{formatDate(c.lastSyncAt)}</span>
                )}
              </div>
              {c.lastSyncSummary && (
                <div className={styles.syncSummary}>{c.lastSyncSummary}</div>
              )}
            </div>

            <div className={styles.cardActions}>
              <Button
                variant="secondary"
                size="small"
                disabled={!c.enabled || syncingId === c.id}
                onClick={() => handleSync(c)}
              >
                <RefreshCw size={14} className={syncingId === c.id ? styles.spinning : ''} />
                {syncingId === c.id ? 'Syncing...' : 'Sync Now'}
              </Button>
              <div className={styles.cardActionGroup}>
                <Button variant="secondary" size="small" onClick={() => router.push(`/admin/integrations/${c.id}`)}>
                  Edit
                </Button>
                <Button variant="danger" size="small" onClick={() => handleDelete(c)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {!loading && connectors.length === 0 && (
          <div className={styles.empty}>
            <Plug2 size={32} className={styles.emptyIcon} />
            <p>No integrations configured yet.</p>
            <p className={styles.emptyHint}>Connect to external systems like Next Insight, ServiceNow, or cloud providers to enrich Atlas with data.</p>
          </div>
        )}
      </div>

      <div className={styles.authSection}>
        <div className={styles.connectorLabel}>Authentication Integrations</div>

        <Card className={styles.authCard}>
          <div className={styles.authCardHeader}>
            <div>
              <div className={styles.authCardTitle}>Single Sign-On (SSO)</div>
              <div className={styles.authCardDesc}>OpenID Connect authentication via external identity providers</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Select label="Enable" options={[{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }]} value={ssoEnabled ? 'true' : 'false'} onChange={(e) => setSsoEnabled(e.target.value === 'true')} />
            <Input label="Issuer URL" placeholder="https://idp.example.com" value={oidcIssuerUrl} onChange={e => setOidcIssuerUrl(e.target.value)} />
            <Input label="Client ID" value={oidcClientId} onChange={e => setOidcClientId(e.target.value)} />
            <Input label="Client Secret" type="password" value={oidcClientSecret} onChange={e => setOidcClientSecret(e.target.value)} />
            <Button variant="primary" onClick={handleSaveSso}>Save SSO Settings</Button>
          </div>
        </Card>

        <Card className={styles.authCard}>
          <div className={styles.authCardHeader}>
            <div>
              <div className={styles.authCardTitle}>SCIM Provisioning</div>
              <div className={styles.authCardDesc}>Cross-domain identity management for auto-provisioning users and groups</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Select label="Enable" options={[{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }]} value={scimEnabled ? 'true' : 'false'} onChange={(e) => setScimEnabled(e.target.value === 'true')} />
            <Input label="Bearer Token" value={scimToken} readOnly onChange={() => {}} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={handleRegenerateToken}>Regenerate Token</Button>
              <Button variant="primary" onClick={handleSaveScim}>Save SCIM Settings</Button>
            </div>
          </div>
        </Card>
      </div>

      {showTypePicker && (
        <div className={styles.modalOverlay} onClick={() => setShowTypePicker(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Choose Integration Type</div>
            <div className={styles.modalGrid}>
              {listConnectors().map((mod) => (
                <button
                  key={mod.type}
                  className={styles.typeOption}
                  onClick={() => {
                    router.push(`/admin/integrations/new?type=${mod.type}`);
                  }}
                >
                  <div className={styles.typeLogo}>{mod.logoInitials}</div>
                  <div style={{ flex: 1 }}>
                    <div className={styles.typeName}>{mod.label}</div>
                    <div className={styles.typeDesc}>Import services, applications, and relationships</div>
                  </div>
                </button>
              ))}
              {COMING_SOON.map((mod) => (
                <div key={mod.type} className={styles.typeOptionDisabled}>
                  <div className={styles.typeLogo}>{mod.logoInitials}</div>
                  <div style={{ flex: 1 }}>
                    <div className={styles.typeNameRow}>
                      <span className={styles.typeName}>{mod.label}</span>
                      <span className={styles.comingSoonBadge}>Soon</span>
                    </div>
                    <div className={styles.typeDesc}>{mod.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setShowTypePicker(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
