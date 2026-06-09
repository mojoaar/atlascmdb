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

  const [adminColDefaults, setAdminColDefaults] = useState({});
  const [adminRowLimit, setAdminRowLimit] = useState(100);
  const [attachmentTypes, setAttachmentTypes] = useState('.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg');
  const [colEditorOpen, setColEditorOpen] = useState(null);
  const [isDemoSeeded, setIsDemoSeeded] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setReseting] = useState(false);
  const [loginAsciiLogo, setLoginAsciiLogo] = useState(false);

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
    racks: [
      { key: 'name', header: 'Name', always: true }, { key: 'rackModel', header: 'Model' },
      { key: 'rackSize', header: 'Size' }, { key: 'lifecycleStatus', header: 'Status' },
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
    fetch('/api/auth/me').then(r => r.json()).then(u => setUser(u)).catch(() => {});
    fetch('/api/admin/demo-status').then(r => r.json()).then(res => {
      if (res && res.isDemoSeeded) {
        setIsDemoSeeded(true);
      }
    }).catch(() => {});
    fetch('/api/me/theme').then(r => r.json()).then(t => {
      if (t) {
        setTheme(t.modePreference || '');
        setTimezone(t.timezone || 'Europe/Copenhagen');
        setClockFormat(t.clockFormat || '24h');
        setDateFormat(t.dateFormat || 'DD/MM/YYYY');
        setGraphDepth(t.graphDepth ?? 3);
      }
    }).catch(() => {});
    fetch('/api/config').then(r => r.json()).then(c => {
      if (c && !c.error) {
        const defaults = {};
        for (const [key, val] of Object.entries(c)) {
          if (key.startsWith('column_default_')) {
            try { defaults[key.replace('column_default_', '')] = JSON.parse(val); } catch {}
          }
        }
        setAdminColDefaults(defaults);
        if (c.row_limit_default) setAdminRowLimit(parseInt(c.row_limit_default) || 100);
        if (c.attachment_allowed_types) setAttachmentTypes(c.attachment_allowed_types);
        if (c.hasOwnProperty('login_ascii_logo')) setLoginAsciiLogo(c.login_ascii_logo === 'true');
      }
    }).catch(() => {});
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

  async function handleResetDemo() {
    setReseting(true);
    try {
      const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast('Demo data reset complete. Only Alice remains.');
        setIsDemoSeeded(false);
        setConfirmReset(false);
      } else {
        await alert(data.error || 'Failed to reset demo data.');
      }
    } catch (err) {
      await alert('An error occurred while resetting demo data.');
    } finally {
      setReseting(false);
    }
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

  async function handleSaveLoginAsciiLogo() {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_ascii_logo: String(loginAsciiLogo) }),
    });
    toast('Login screen settings saved');
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
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>UI Library</div>
                  <div className={styles.fieldValue}>React 19.2</div>
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
        <div className={styles.sectionTitle}>Login Screen</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
              Enable an Atlas ASCII art logo on the login screen instead of standard text.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={loginAsciiLogo}
                  onChange={(e) => setLoginAsciiLogo(e.target.checked)}
                />
                Use ASCII Logo on Login Screen
              </label>
            </div>
            
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Preview:</div>
              <pre style={{
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                lineHeight: '1.2',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                width: 'fit-content',
                margin: 0,
                color: 'var(--foreground)'
              }}>
{[
  "    _   _   _           ",
  "   / \\ | |_| | __ _ ___ ",
  "  / _ \\| __| |/ _` / __|",
  " / ___ \\ |_| | (_| \\__ \\",
  "/_/   \\_\\__|_|\\__,_|___/"
].join('\n')}
              </pre>
            </div>
            
            <div style={{ marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={handleSaveLoginAsciiLogo}>Save Login Settings</Button>
            </div>
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
        <div className={styles.sectionTitle}>Credits &amp; Dependencies</div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <Credit name="Next.js" url="https://nextjs.org" />
            <Credit name="React" url="https://react.dev" />
            <Credit name="Knex.js" url="https://knexjs.org" />
            <Credit name="better-sqlite3" url="https://github.com/WiseLibs/better-sqlite3" />
            <Credit name="node-postgres (pg)" url="https://github.com/brianc/node-postgres" />
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
            <Credit name="qrcode" url="https://github.com/soldair/node-qrcode" />
            <Credit name="uuid" url="https://github.com/uuidjs/uuid" />
            <Credit name="Prism.js" url="https://prismjs.com" />
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

      {isDemoSeeded && (
        <div className={styles.section}>
          <div className={styles.sectionTitle} style={{ color: 'var(--danger)' }}>Danger Zone</div>
          <Card style={{ borderColor: 'var(--danger)', borderWidth: '2px', borderStyle: 'solid' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.4' }}>
                This option will permanently delete all demo data from the database. All services, applications, 
                CIs, relationships, assets, locations, teams, audit logs, and users (except <strong>Alice Admin</strong>) 
                will be lost. System roles, default configuration, and themes will be preserved.
              </p>
              {!confirmReset ? (
                <div>
                  <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset Demo Data</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--danger)' }}>
                    Are you absolutely sure? This cannot be undone.
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="danger" disabled={resetting} onClick={handleResetDemo}>
                      {resetting ? 'Resetting...' : 'Yes, Permanently Delete All Demo Data'}
                    </Button>
                    <Button variant="secondary" disabled={resetting} onClick={() => setConfirmReset(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
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
