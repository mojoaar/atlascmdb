'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import ColumnSelector from '@/components/ui/ColumnSelector';
import { useFormat } from '@/components/auth/AuthProvider';
import styles from '@/styles/entity.module.css';
import { THEME_OPTIONS, TIMEZONE_OPTIONS, CLOCK_OPTIONS, DATE_OPTIONS, ROW_LIMIT_OPTIONS } from '@/lib/settings-options';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import { version } from '@/../package.json';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { refresh } = useFormat();
  const { alert, confirm, toast } = useFeedback();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('');
  const [timezone, setTimezone] = useState('Europe/Copenhagen');
  const [clockFormat, setClockFormat] = useState('24h');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [graphDepth, setGraphDepth] = useState(3);

  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [oidcIssuerUrl, setOidcIssuerUrl] = useState('');
  const [oidcClientId, setOidcClientId] = useState('');
  const [oidcClientSecret, setOidcClientSecret] = useState('');
  const [scimEnabled, setScimEnabled] = useState(false);
  const [scimToken, setScimToken] = useState('');
  const [adminColDefaults, setAdminColDefaults] = useState({});
  const [adminRowLimit, setAdminRowLimit] = useState(100);
  const [attachmentTypes, setAttachmentTypes] = useState('.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg');
  const [colEditorOpen, setColEditorOpen] = useState(null);

  const columnDefs = {
    services: [
      { key: 'name', header: 'Name', always: true }, { key: 'businessServiceId', header: 'Type' },
      { key: 'description', header: 'Description', default: false }, { key: 'lifecycleStatus', header: 'Status' },
      { key: 'ownerTeamName', header: 'Team' }, { key: 'environment', header: 'Environment' },
      { key: 'classification', header: 'Classification', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    applications: [
      { key: 'name', header: 'Name', always: true }, { key: 'appType', header: 'Type' },
      { key: 'description', header: 'Description', default: false }, { key: 'lifecycleStatus', header: 'Status' },
      { key: 'ownerTeamName', header: 'Team' }, { key: 'vendor', header: 'Vendor', default: false },
      { key: 'version', header: 'Version', default: false }, { key: 'environment', header: 'Environment', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    cis: [
      { key: 'name', header: 'Name', always: true }, { key: 'ciType', header: 'Class' },
      { key: 'description', header: 'Description', default: false }, { key: 'lifecycleStatus', header: 'Status' },
      { key: 'locationName', header: 'Location' }, { key: 'environment', header: 'Environment', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    assets: [
      { key: 'name', header: 'Name', always: true }, { key: 'assetTag', header: 'Tag' },
      { key: 'ciName', header: 'CI' }, { key: 'category', header: 'Category' },
      { key: 'model', header: 'Model', default: false }, { key: 'status', header: 'Status' },
      { key: 'locationName', header: 'Location', default: false }, { key: 'assignedToName', header: 'Assigned To', default: false },
      { key: 'supplier', header: 'Supplier', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    teams: [
      { key: 'name', header: 'Name', always: true }, { key: 'type', header: 'Type' },
      { key: 'status', header: 'Status' }, { key: 'managerName', header: 'Manager', default: false },
      { key: 'leadName', header: 'Lead', default: false }, { key: 'roleName', header: 'Role' },
      { key: 'parentTeamName', header: 'Parent Team', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    users: [
      { key: 'displayName', header: 'Name', always: true }, { key: 'email', header: 'Email' },
      { key: 'managerName', header: 'Manager' }, { key: 'status', header: 'Status' },
      { key: 'roleNames', header: 'Roles' },
      { key: 'mfaEnabled', header: 'MFA', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    locations: [
      { key: 'name', header: 'Name', always: true }, { key: 'city', header: 'City' },
      { key: 'type', header: 'Type' }, { key: 'status', header: 'Status' },
      { key: 'parentLocationName', header: 'Parent' },
      { key: 'country', header: 'Country', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    roles: [
      { key: 'name', header: 'Name', always: true }, { key: 'description', header: 'Description', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    themes: [
      { key: 'name', header: 'Name', always: true }, { key: 'isActive', header: 'Active' },
      { key: 'isDefault', header: 'Default' },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    relationships: [
      { key: 'sourceType', header: 'Source Type', always: true }, { key: 'sourceId', header: 'Source ID' },
      { key: 'relationshipType', header: 'Type' }, { key: 'targetType', header: 'Target Type' },
      { key: 'targetId', header: 'Target ID' }, { key: 'direction', header: 'Direction' },
      { key: 'notes', header: 'Notes', default: false },
      { key: 'createdByName', header: 'Created By', default: false }, { key: 'updatedByName', header: 'Updated By', default: false },
      { key: 'createdAt', header: 'Created', default: false }, { key: 'updatedAt', header: 'Updated', default: false },
    ],
    audit_events: [
      { key: 'createdAt', header: 'Timestamp', always: true }, { key: 'actorName', header: 'Actor' },
      { key: 'action', header: 'Action' }, { key: 'entityType', header: 'Entity Type' },
      { key: 'entityId', header: 'Entity ID' }, { key: 'actorEmail', header: 'Email', default: false },
    ],
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => setUser(u));
    fetch('/api/me/theme').then(r => r.json()).then(t => {
      if (t) {
        setTheme(t.modePreference || '');
        setTimezone(t.timezone || 'Europe/Copenhagen');
        setClockFormat(t.clockFormat || '24h');
        setDateFormat(t.dateFormat || 'DD/MM/YYYY');
        setGraphDepth(t.graphDepth ?? 3);
      }
    });
    fetch('/api/config').then(r => r.json()).then(c => {
      if (c && !c.error) {
        setSsoEnabled(c.sso_enabled === 'true');
        setOidcIssuerUrl(c.oidc_issuer_url || '');
        setOidcClientId(c.oidc_client_id || '');
        setOidcClientSecret('');
        setScimEnabled(c.scim_enabled === 'true');
        setScimToken(c.scim_bearer_token_masked || '');
        const defaults = {};
        for (const [key, val] of Object.entries(c)) {
          if (key.startsWith('column_default_')) {
            try { defaults[key.replace('column_default_', '')] = JSON.parse(val); } catch {}
          }
        }
        setAdminColDefaults(defaults);
        if (c.row_limit_default) setAdminRowLimit(parseInt(c.row_limit_default) || 100);
        if (c.attachment_allowed_types) setAttachmentTypes(c.attachment_allowed_types);
      }
    });
  }, []);

  async function handleSaveTheme() {
    await fetch('/api/me/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modePreference: theme,
        timezone,
        clockFormat,
        dateFormat,
        graphDepth,
      }),
    });
    refresh();
    toast('Settings saved');
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

  async function handleSaveColumnDefaults(entityType, selected) {
    const body = { [`column_default_${entityType}`]: JSON.stringify([...selected]) };
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setAdminColDefaults(prev => ({ ...prev, [entityType]: [...selected] }));
    setColEditorOpen(null);
  }

  async function handleSaveRowLimit() {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row_limit_default: String(adminRowLimit) }),
    });
    toast('Row limit saved');
  }

  async function handleSaveAttachmentTypes() {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachment_allowed_types: attachmentTypes }),
    });
    toast('Attachment settings saved');
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
    await alert('Token regenerated. Copy it now as it will not be shown again.');
    navigator.clipboard.writeText(newToken);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>System Information</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Application</div>
              <div className={styles.fieldValue}>Atlas CMDB</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Version</div>
              <div className={styles.fieldValue}>{version} (MVP)</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Database</div>
              <div className={styles.fieldValue}>SQLite (dev) / PostgreSQL (prod)</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Framework</div>
              <div className={styles.fieldValue}>Next.js 16.2 (App Router)</div>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Theme Preference</div>
        <Card>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Select label="Mode" options={THEME_OPTIONS} value={theme} onChange={(e) => setTheme(e.target.value)} />
            </div>
            <Button variant="secondary" onClick={handleSaveTheme}>Save</Button>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Default Column Views</div>
        <Card>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Select label="Rows Per Page (default)" options={ROW_LIMIT_OPTIONS} value={String(adminRowLimit)} onChange={e => setAdminRowLimit(Number(e.target.value))} />
            </div>
            <Button variant="secondary" onClick={handleSaveRowLimit}>Save</Button>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
            Set the default visible columns for all users. Individual users can still customize their own view.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {Object.keys(columnDefs).map(et => {
              const defs = columnDefs[et];
              const current = adminColDefaults[et];
              return (
                <div key={et} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.375rem 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>{et.replace(/_/g, ' ')}</span>
                  <Button variant="secondary" size="small" onClick={() => setColEditorOpen(et)}>Edit</Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Attachment Settings</div>
        <Card>
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
            Allowed file extensions for asset attachments (comma-separated, no spaces).
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input label="Allowed Extensions" value={attachmentTypes} onChange={e => setAttachmentTypes(e.target.value)} placeholder=".pdf,.docx,.png,.jpg" />
            </div>
            <Button variant="secondary" onClick={handleSaveAttachmentTypes}>Save</Button>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Locale Settings</div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
            <Select label="Timezone" options={TIMEZONE_OPTIONS} value={timezone} onChange={e => setTimezone(e.target.value)} />
            <Select label="Clock Format" options={CLOCK_OPTIONS} value={clockFormat} onChange={e => setClockFormat(e.target.value)} />
            <Select label="Date Format" options={DATE_OPTIONS} value={dateFormat} onChange={e => setDateFormat(e.target.value)} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Graph Depth</div>
              <Input type="number" min="1" max="6" value={String(graphDepth)} onChange={e => setGraphDepth(Number(e.target.value))} />
            </div>
          </div>
          <Button variant="secondary" onClick={handleSaveTheme}>Save Preferences</Button>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>SSO Configuration</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Select label="Enable" options={[{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }]} value={ssoEnabled ? 'true' : 'false'} onChange={(e) => setSsoEnabled(e.target.value === 'true')} />
            <Input label="Issuer URL" placeholder="https://idp.example.com" value={oidcIssuerUrl} onChange={e => setOidcIssuerUrl(e.target.value)} />
            <Input label="Client ID" value={oidcClientId} onChange={e => setOidcClientId(e.target.value)} />
            <Input label="Client Secret" type="password" value={oidcClientSecret} onChange={e => setOidcClientSecret(e.target.value)} />
            <Button variant="primary" onClick={handleSaveSso}>Save SSO Settings</Button>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>SCIM Configuration</div>
        <Card>
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

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Authentication</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>MFA</div>
              <div className={styles.fieldValue}>TOTP (otpauth)</div>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Credits &amp; Dependencies</div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <Credit name="Next.js" url="https://nextjs.org" />
            <Credit name="React" url="https://react.dev" />
            <Credit name="Knex.js" url="https://knexjs.org" />
            <Credit name="better-sqlite3" url="https://github.com/WiseLibs/better-sqlite3" />
            <Credit name="@xyflow/react" url="https://reactflow.dev" />
            <Credit name="@dagrejs/dagre" url="https://github.com/dagrejs/dagre" />
            <Credit name="recharts" url="https://recharts.org" />
            <Credit name="react-leaflet" url="https://react-leaflet.js.org" />
            <Credit name="Leaflet" url="https://leafletjs.com" />
            <Credit name="OpenStreetMap" url="https://www.openstreetmap.org/about" />
            <Credit name="lucide-react" url="https://lucide.dev" />
            <Credit name="openid-client" url="https://github.com/panva/openid-client" />
            <Credit name="jsonwebtoken" url="https://github.com/auth0/node-jsonwebtoken" />
            <Credit name="otpauth" url="https://github.com/hectorm/otpauth" />
            <Credit name="bcryptjs" url="https://github.com/dcodeIO/bcrypt.js" />
            <Credit name="uuid" url="https://github.com/uuidjs/uuid" />
            <Credit name="Catppuccin" url="https://catppuccin.com" />
            <Credit name="Nord" url="https://www.nordtheme.com" />
            <Credit name="Dracula" url="https://draculatheme.com" />
            <Credit name="Cyberpunk" url="https://www.media.io/color-palette/cyberpunk-color-palette.html" />
          </div>
        </Card>
      </div>

      {colEditorOpen && columnDefs[colEditorOpen] && (
        <ColumnSelector
          open={!!colEditorOpen}
          columns={columnDefs[colEditorOpen].map(c => ({ key: c.key, label: c.header, always: c.always, default: c.default }))}
          visible={adminColDefaults[colEditorOpen] || columnDefs[colEditorOpen].filter(c => c.default !== false).map(c => c.key)}
          headerNote="These are system-wide defaults. Users can override with a personal view."
          onApply={(selected) => handleSaveColumnDefaults(colEditorOpen, selected)}
          onClose={() => setColEditorOpen(null)}
        />
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Button variant="secondary" onClick={() => router.push('/api/auth/me')}>View API Response</Button>
      </div>
    </div>
  );
}

function Credit({ name, url }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--foreground)', textDecoration: 'none', padding: '0.25rem 0' }}>
      {name}
    </a>
  );
}
