'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import CodeBlock from '@/components/ui/CodeBlock';
import { getEntityFields } from '@/lib/form-fields';
import styles from './page.module.css';

const ENTITY_LABELS = {
  service: 'Services',
  application: 'Applications',
  ci: 'Configuration Items',
  asset: 'Assets',
};

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'auth', label: 'Auth & RBAC' },
  { id: 'sso', label: 'SSO Integration' },
  { id: 'entities', label: 'Entity Types' },
  { id: 'service', label: 'Services', indent: true },
  { id: 'application', label: 'Applications', indent: true },
  { id: 'ci', label: 'CIs', indent: true },
  { id: 'asset', label: 'Assets', indent: true },
  { id: 'data-model', label: 'Data Model' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'deployment', label: 'Deployment' },
];

function FieldTable({ entityType }) {
  const fields = getEntityFields(entityType);
  if (!fields.length) return null;

  const typeBadge = (field) => {
    if (field.type === 'select') return <span className={`${styles.badge} ${styles.badgeSelect}`}>select</span>;
    if (field.inputType === 'date') return <span className={`${styles.badge} ${styles.badgeDate}`}>date</span>;
    if (field.inputType === 'number') return <span className={`${styles.badge} ${styles.badgeNumber}`}>number</span>;
    if (field.inputType === 'textarea') return <span className={styles.badge}>textarea</span>;
    return <span className={`${styles.badge} ${styles.badgeText}`}>text</span>;
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th style={{ width: 180 }}>Field</th>
          <th style={{ width: 80 }}>Type</th>
          <th style={{ width: 60 }}>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f.id}>
            <td><code>{f.id}</code></td>
            <td>{typeBadge(f)}</td>
            <td>{f.required ? <span className={styles.required}>Yes</span> : '—'}</td>
            <td style={{ color: 'var(--muted-foreground)' }}>{f.description || f.label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState('overview');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('atlas-theme-mode');
    const current = saved || document.documentElement.getAttribute('data-theme') || 'light';
    if (current === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    setTheme(current);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('atlas-theme-mode', next);
    setTheme(next);
  }

  return (
    <div className={styles.docs}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>Contents</div>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`${styles.navLink}${active === s.id ? ' ' + styles.navLinkActive : ''}`}
            style={s.indent ? { paddingLeft: '1.5rem' } : undefined}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={styles.main}>
        {/* OVERVIEW */}
        {active === 'overview' && (
          <>
            <h1>Atlas CMDB Documentation</h1>
            <p>
              Atlas is an open-source CMDB built for modern IT teams.
              It provides a centralized system for managing IT infrastructure —
              services, applications, configuration items (CIs), assets, teams,
              locations, and their relationships — built on Next.js 16 and React 19.
            </p>

            <h2>Getting Started</h2>
            <p>
              After deployment, log in with the default admin account:
            </p>
            <CodeBlock language="text">{`Email: alice@atlas.local
Password: password123`}</CodeBlock>
            <p>
              The application has two interfaces:
            </p>
            <ul>
              <li><strong>Admin</strong> at <code>/admin</code> — Full CRUD, user management, system settings, import pipeline, audit trail, and form designer.</li>
              <li><strong>Portal</strong> at <code>/portal</code> — Read-focused views with graphs, maps, search, and notifications for editors and viewers.</li>
            </ul>

            <h2>Command Reference</h2>
            <CodeBlock language="bash">{`npm run dev      — Start dev server (Turbopack)
npm run build    — Production build
npm run test     — Run test suite (vitest)
npm run db:setup — Reset DB: drop → migrate → seed
npm run lint     — Run linter`}</CodeBlock>
          </>
        )}

        {/* ENTITY TYPES OVERVIEW */}
        {active === 'entities' && (
          <>
            <h1>Entity Types</h1>
            <p>
              Atlas manages nine entity types. The four primary types — services,
              applications, CIs, and assets — support the full Form Designer with
              customizable field layouts.
            </p>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>API</th>
                  <th>Form Designer</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Services</strong></td>
                  <td><code>/api/services</code></td>
                  <td>Yes — 11 fields</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Business and technical services with type-specific fields (criticality, tier, support model)</td>
                </tr>
                <tr>
                  <td><strong>Applications</strong></td>
                  <td><code>/api/applications</code></td>
                  <td>Yes — 10 fields</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Software applications with vendor, version, technology stack details</td>
                </tr>
                <tr>
                  <td><strong>Configuration Items</strong></td>
                  <td><code>/api/cis</code></td>
                  <td>Yes — 11 fields</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Physical or virtual IT assets — servers, network devices, databases, containers, racks</td>
                </tr>
                <tr>
                  <td><strong>Assets</strong></td>
                  <td><code>/api/assets</code></td>
                  <td>Yes — 13 fields</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Hardware, licenses, and equipment with cost, warranty, and assignment tracking</td>
                </tr>
                <tr>
                  <td><strong>Teams</strong></td>
                  <td><code>/api/teams</code></td>
                  <td>No</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Organizational teams with members and inherited roles</td>
                </tr>
                <tr>
                  <td><strong>Locations</strong></td>
                  <td><code>/api/locations</code></td>
                  <td>No</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Geographic sites with coordinates, addresses, and parent hierarchy</td>
                </tr>
                <tr>
                  <td><strong>Users</strong></td>
                  <td><code>/api/users</code></td>
                  <td>No</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>User accounts with roles, MFA, manager, and avatar preferences</td>
                </tr>
                <tr>
                  <td><strong>Roles</strong></td>
                  <td><code>/api/roles</code></td>
                  <td>No</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>RBAC role definitions with granular permissions</td>
                </tr>
                <tr>
                  <td><strong>Themes</strong></td>
                  <td><code>/api/themes</code></td>
                  <td>No</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Visual themes with dual light/dark mode CSS token sets</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* SERVICE FIELDS */}
        {active === 'service' && (
          <>
            <h1>Services</h1>
            <p>
              Services represent business or technical capabilities provided to users.
              They use table inheritance: <code>service_base</code> holds shared columns,
              with <code>business_services</code> and <code>technical_services</code> storing
              type-specific fields.
            </p>
            <p>
              <strong>API endpoints:</strong> <code>GET/POST /api/services</code>, <code>GET/PATCH/DELETE /api/services/:id</code>
            </p>
            <h3>Field Reference</h3>
            <FieldTable entityType="service" />
          </>
        )}

        {/* APPLICATION FIELDS */}
        {active === 'application' && (
          <>
            <h1>Applications</h1>
            <p>
              Applications represent software systems with versions, vendors, and technology
              stacks. They use table inheritance: <code>application_base</code> holds shared
              columns, with <code>applications</code> storing app-specific fields.
            </p>
            <p>
              <strong>API endpoints:</strong> <code>GET/POST /api/applications</code>, <code>GET/PATCH/DELETE /api/applications/:id</code>
            </p>
            <h3>Field Reference</h3>
            <FieldTable entityType="application" />
          </>
        )}

        {/* CI FIELDS */}
        {active === 'ci' && (
          <>
            <h1>Configuration Items</h1>
            <p>
              Configuration Items (CIs) represent physical or virtual infrastructure
              components. They use table inheritance: <code>ci_base</code> holds shared columns,
              with <code>cis</code> storing CI-specific fields.
            </p>
            <p>
              <strong>API endpoints:</strong> <code>GET/POST /api/cis</code>, <code>GET/PATCH/DELETE /api/cis/:id</code>
            </p>
            <h3>Field Reference</h3>
            <FieldTable entityType="ci" />
          </>
        )}

        {/* ASSET FIELDS */}
        {active === 'asset' && (
          <>
            <h1>Assets</h1>
            <p>
              Assets represent hardware, software licenses, and equipment. They can be
              linked to a CI for tracking ownership relationships. Assets support file
              attachments for invoices, warranties, and configuration documents.
            </p>
            <p>
              <strong>API endpoints:</strong> <code>GET/POST /api/assets</code>, <code>GET/PATCH/DELETE /api/assets/:id</code>
            </p>
            <h3>Field Reference</h3>
            <FieldTable entityType="asset" />
          </>
        )}

        {/* DATA MODEL */}
        {active === 'data-model' && (
          <>
            <h1>Data Model</h1>
            <p>
              Atlas uses SQLite (development) or PostgreSQL (production) with 26 tables.
              Three entity types use table inheritance:
            </p>

            <h2>Table Inheritance</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Base Table</th>
                  <th>Child Table(s)</th>
                  <th>Discriminator</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Services</td>
                  <td><code>service_base</code></td>
                  <td><code>business_services</code>, <code>technical_services</code></td>
                  <td><code>type</code> (business | technical)</td>
                </tr>
                <tr>
                  <td>Applications</td>
                  <td><code>application_base</code></td>
                  <td><code>applications</code></td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>CIs</td>
                  <td><code>ci_base</code></td>
                  <td><code>cis</code></td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>

            <h2>Core Tables</h2>
            <ul>
              <li><code>users</code> — User accounts with displayName, email, passwordHash, managerId, avatarUrl, avatarBg, MFA settings, status</li>
              <li><code>roles</code> — Role definitions with name, description, permissions</li>
              <li><code>user_roles</code> — Direct user-to-role assignments</li>
              <li><code>teams</code> — Organizational teams with type, status, managerId, leadId</li>
              <li><code>team_members</code> — Team membership with team-inherited roleId</li>
              <li><code>locations</code> — Geographic sites with type, parent hierarchy, lat/lng, full addresses</li>
              <li><code>relationships</code> — Entity relationships (sourceType/id → targetType/id) with relationshipType and direction</li>
              <li><code>assets</code> — Hardware/licenses with cost, warranty, assignment, CI linking</li>
            </ul>

            <h2>Supporting Tables</h2>
            <ul>
              <li><code>sessions</code> — JWT refresh token sessions with rotation</li>
              <li><code>audit_events</code> — Before/after JSON snapshots on all write operations</li>
              <li><code>themes</code> — CSS variable token sets with light and dark mode palettes</li>
              <li><code>user_theme_preferences</code> — Per-user theme, locale, graph depth, column and row preferences</li>
              <li><code>app_config</code> — Key-value system configuration (SSO, SCIM, column defaults, attachment settings)</li>
              <li><code>notifications</code> — In-app notification bell with auto-triggers from audit events</li>
              <li><code>import_sets</code>, <code>import_rows</code>, <code>import_mappings</code> — Data import pipeline</li>
              <li><code>attachments</code> — File attachments for assets and entities</li>
              <li><code>service_fts</code>, <code>application_fts</code>, <code>ci_fts</code> — SQLite FTS5 full-text indexes with auto-sync triggers</li>
            </ul>
          </>
        )}

        {/* RELATIONSHIPS */}
        {active === 'relationships' && (
          <>
            <h1>Relationships</h1>
            <p>
              Relationships model connections between entities. They are used to build
              the interactive relationship graph and are stored in the <code>relationships</code> table.
            </p>

            <h2>Relationship Structure</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>sourceType</code></td><td style={{ color: 'var(--muted-foreground)' }}>Entity type of the source (service, application, ci, asset)</td></tr>
                <tr><td><code>sourceId</code></td><td style={{ color: 'var(--muted-foreground)' }}>UUID of the source entity</td></tr>
                <tr><td><code>targetType</code></td><td style={{ color: 'var(--muted-foreground)' }}>Entity type of the target</td></tr>
                <tr><td><code>targetId</code></td><td style={{ color: 'var(--muted-foreground)' }}>UUID of the target entity</td></tr>
                <tr><td><code>relationshipType</code></td><td style={{ color: 'var(--muted-foreground)' }}>Type of relationship (see below)</td></tr>
                <tr><td><code>direction</code></td><td style={{ color: 'var(--muted-foreground)' }}>outbound, inbound, or bidirectional</td></tr>
                <tr><td><code>notes</code></td><td style={{ color: 'var(--muted-foreground)' }}>Free-text description of the relationship</td></tr>
              </tbody>
            </table>

            <h2>Relationship Types</h2>
            <ul>
              <li><code>depends_on</code> — One entity depends on another (e.g., Application depends on Database)</li>
              <li><code>hosted_on</code> — An entity is hosted on infrastructure (e.g., Application hosted on Server)</li>
              <li><code>owned_by</code> — An entity is owned by a team (e.g., Service owned by Platform Engineering)</li>
              <li><code>part_of</code> — An entity is part of a larger entity (e.g., Server part of Data Center)</li>
              <li><code>connects_to</code> — Network connectivity between CIs</li>
              <li><code>uses</code> — An entity uses another (e.g., Application uses Service)</li>
            </ul>

            <h2>Graph Visualization</h2>
            <p>
              The relationship graph uses <code>@xyflow/react</code> with <code>@dagrejs/dagre</code> auto-layout.
              Graph API: <code>GET /api/entities/:type/:id/graph?depth=1-6</code>.
              Center node is highlighted in deep pink. Color-coded by entity type:
              blue (services), green (applications), orange (CIs). Depth defaults to 3
              and can be configured per-user in settings.
            </p>
          </>
        )}

        {/* AUTH & RBAC */}
        {active === 'auth' && (
          <>
            <h1>Authentication & RBAC</h1>

            <h2>Authentication</h2>
            <p>
              Atlas uses JWT-based authentication with httpOnly cookies (access token) and
              Bearer tokens for API access. Refresh tokens are stored in the <code>sessions</code>
              table with rotation on each use — a mismatched token invalidates the entire session.
            </p>
            <ul>
              <li><strong>Access token:</strong> 15 minutes (configurable via <code>JWT_EXPIRES_IN</code>)</li>
              <li><strong>Refresh token:</strong> 7 days (configurable via <code>JWT_REFRESH_EXPIRES_IN</code>)</li>
              <li><strong>MFA:</strong> TOTP-based (otpauth) with QR code setup and confirm flow</li>
            </ul>

            <h3>Impersonation</h3>
            <p>
              Administrators can impersonate other users to troubleshoot or verify
              permission configurations. When impersonating:
            </p>
            <ul>
              <li>The admin's real identity is preserved — all audit events are tagged
              with the <strong>actual</strong> actor, not the impersonated user</li>
              <li>A banner appears at the top of the UI indicating the impersonation
              session is active</li>
              <li>Self-attribute updates (avatar colour, background, formatting prefs)
              apply to the impersonated user, not the admin</li>
              <li>Sessions can be ended via the "Un-impersonate" button in the user menu</li>
              <li>This is not a privilege escalation mechanism — the admin already has
              full access; impersonation provides testing context</li>
            </ul>

            <h2>Authorization (RBAC)</h2>
            <p>
              Three built-in roles control access:
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>admin</strong></td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Full system access — all CRUD operations, user/role management, settings, SCIM/SSO configuration, impersonation</td>
                </tr>
                <tr>
                  <td><strong>editor</strong></td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Write access to services, apps, CIs, assets, teams, locations, relationships. Read-only on users/roles/settings</td>
                </tr>
                <tr>
                  <td><strong>viewer</strong></td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Read-only access to all entities via portal. No admin panel access</td>
                </tr>
              </tbody>
            </table>

            <h3>Role Resolution</h3>
            <p>
              Roles can be assigned directly to users (<code>user_roles</code>) or inherited
              through team membership (<code>team_members.roleId</code>). The resolution order is:
            </p>
            <ol>
              <li>Check for direct user role assignments — if any exist, team roles are <strong>ignored</strong></li>
              <li>If no direct roles, check all team memberships — use the <strong>highest</strong> role from any team</li>
            </ol>
            <p>
              This means user-assigned roles always win over team-inherited roles.
            </p>

            <h2>API Auth</h2>
            <p>
              Protected API routes use guard closures from <code>src/lib/rbac.js</code>:
            </p>
            <CodeBlock language="javascript">{`// RBAC guards (must be called to get the closure, then invoked with request)
const auth = await requireAuth()(request);      // any authenticated user
const auth = await requireAdmin()(request);     // admin only
const auth = await requireEditor()(request);    // editor or admin`}</CodeBlock>

            <h2>SCIM</h2>
            <p>
              SCIM v2 endpoints for user and group provisioning (RFC 7644). Requires a
              bearer token configured in admin settings. Endpoints:
            </p>
            <ul>
              <li><code>GET/POST/PATCH/PUT/DELETE /api/scim/v2/Users</code></li>
              <li><code>GET/POST/PATCH/PUT/DELETE /api/scim/v2/Groups</code></li>
              <li>Discovery: <code>/api/scim/v2/ServiceProviderConfig</code>, <code>/api/scim/v2/ResourceTypes</code>, <code>/api/scim/v2/Schemas</code></li>
            </ul>
          </>
        )}

        {/* SSO INTEGRATION */}
        {active === 'sso' && (
          <>
            <h1>SSO Integration</h1>
            <p>
              Atlas supports OIDC (OpenID Connect) single sign-on with PKCE S256
              for enhanced security. Tested with Microsoft Entra ID and Keycloak.
            </p>

            <h2>Configuration</h2>
            <p>
              Navigate to <strong>Admin → Settings → SSO Settings</strong> to enable and configure:
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Setting</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>SSO Enabled</code></td><td style={{ color: 'var(--muted-foreground)' }}>Toggle to enable/disable SSO</td></tr>
                <tr><td><code>Issuer URL</code></td><td style={{ color: 'var(--muted-foreground)' }}>OIDC issuer URL (e.g., https://login.microsoftonline.com/:tenant/v2.0)</td></tr>
                <tr><td><code>Client ID</code></td><td style={{ color: 'var(--muted-foreground)' }}>OIDC application client ID</td></tr>
                <tr><td><code>Client Secret</code></td><td style={{ color: 'var(--muted-foreground)' }}>OIDC application client secret</td></tr>
              </tbody>
            </table>

            <h2>Microsoft Entra ID (Azure AD)</h2>
            <ol>
              <li>Register a new application in the Azure Portal (App registrations)</li>
              <li>Set redirect URI: <code>https://your-domain.com/api/auth/sso/callback</code></li>
              <li>Under <strong>Certificates & secrets</strong>, create a client secret</li>
              <li>Copy the Directory (tenant) ID, Application (client) ID, and secret</li>
              <li>Issuer URL format: <code>https://login.microsoftonline.com/:tenant-id/v2.0</code></li>
            </ol>

            <h2>Keycloak</h2>
            <ol>
              <li>Create a new client in your Keycloak realm</li>
              <li>Set <strong>Client Protocol</strong> to <code>openid-connect</code></li>
              <li>Set <strong>Access Type</strong> to <code>confidential</code></li>
              <li>Set Valid Redirect URI: <code>https://your-domain.com/api/auth/sso/callback</code></li>
              <li>Issuer URL format: <code>https://keycloak.example.com/realms/:realm-name</code></li>
            </ol>
          </>
        )}

        {/* FEATURES */}
        {active === 'features' && (
          <>
            <h1>Features</h1>

            <h2>Form Designer</h2>
            <p>
              Admin users can customize field layouts for services, applications, CIs,
              and assets. Accessible from the hamburger menu (⋮) on any detail page.
              Features include:
            </p>
            <ul>
              <li>Drag-and-drop field reordering within sections</li>
              <li>Cross-section field moves (drag a field to another section in the left panel)</li>
              <li>Custom sections with configurable column counts (1–3)</li>
              <li>Toggleable built-in sections for Relationships and Audit Trail</li>
              <li>Reset to default layout per entity type</li>
              <li>Layouts persist via <code>/api/config</code> with key <code>form_layout_*</code></li>
            </ul>

            <h3>Per-Class CI Layouts</h3>
            <p>
              Each CI class (server, database, network device, storage, container,
              rack, other) can have its own independently saved form layout.
              Config keys follow the pattern <code>form_layout_ci:{`{ciType}`}</code> —
              e.g. <code>form_layout_ci:server</code>, <code>form_layout_ci:database</code>.
              The generic <code>form_layout_ci</code> key serves as the fallback for any
              CI class that has not been explicitly customized. This means:
            </p>
            <ul>
              <li>Change the CI type on a new record and the form layout switches to
              match that class's saved layout (fields reorder, sections reorganize)</li>
              <li>Each class can expose different fields — a database server may show
              lifecycle status and classification front-and-centre, while a container
              CI keeps those in a secondary section</li>
              <li>The Form Designer button always edits the layout for the
              <strong>current CI's class</strong>, not the generic layout</li>
            </ul>

            <h2>Rack Layout</h2>
            <p>
              Datacenter racks (CI type <code>rack</code>) feature a visual rack viewer
              with their own dedicated admin section at <code>/admin/racks</code>:
            </p>
            <ul>
              <li>Visual U-slot grid (42U or 48U, configurable rack size)</li>
              <li>Front/back toggle for dual-sided rack mounting</li>
              <li>Place any CI from <code>ci_base</code> into rack slots (single or multi-U)</li>
              <li>Auto-detection of occupied slots with overlap prevention</li>
              <li>Color-coded CI type badges (server, network, storage, database, container)</li>
              <li>Relationship auto-creation: placing a CI in a rack creates a <code>hosted_on</code> relationship</li>
              <li>Manage placements via <code>/api/cis/{'{id}'}/rack-placements</code></li>
            </ul>

            <h3>Rack Form Editor</h3>
            <p>
              The rack detail page uses the same Form Designer system but includes a
              dedicated <strong>Rack Layout</strong> component section:
            </p>
            <ul>
              <li>The rack form shows rack-specific fields (size, model) alongside
              standard CI fields (name, location, lifecycle status)</li>
              <li>The Rack Layout section appears as a toggleable component in the
              Form Designer — it can be shown, hidden, or reordered just like
              Relationships and Audit Trail</li>
              <li>Clicking an empty U-slot in the grid opens a modal to assign a CI;
              clicking an occupied slot opens the edit modal to adjust the placement</li>
              <li>Rack placements auto-create <code>hosted_on</code> relationships that
              appear in both the rack's graph and the placed CI's graph</li>
            </ul>

            <h2>Relationship Graph</h2>
            <p>
              Interactive visualization using <code>@xyflow/react</code> with <code>@dagrejs/dagre</code> auto-layout:
            </p>
            <ul>
              <li>Configurable depth (1–6 levels, default 3)</li>
              <li>Color-coded nodes by entity type</li>
              <li>Labeled edges with human-readable relationship types</li>
              <li>Full-screen view with minimap, zoom, and pan controls</li>
              <li>Inline preview on entity detail pages (fixed depth 2)</li>
            </ul>

            <h2>Location Maps</h2>
            <p>
              Leaflet-based maps on location detail pages with:
            </p>
            <ul>
              <li>Color-coded markers by location type (Country, Data Center, Office)</li>
              <li>OpenStreetMap tiles with automatic dark mode via CartoDB dark tiles</li>
              <li>Expand/collapse toggle (70vh expanded)</li>
              <li>Popups with name, type, and description</li>
            </ul>

            <h2>Dashboard & Analytics</h2>
            <p>
              Recharts-powered dashboard with:
            </p>
            <ul>
              <li>Entity count cards for all types</li>
              <li>Service type breakdown (pie chart)</li>
              <li>Entity creation trends (line chart, 30-day window)</li>
              <li>Role-based filtering (editors see fewer cards)</li>
            </ul>

            <h2>Bulk Operations</h2>
            <p>
              Select multiple rows in any entity list, then delete all selected items
              via <code>DELETE /api/bulk</code>.
            </p>

            <h2>Data Import Pipeline</h2>
            <p>
              Multi-stage CSV/JSON import process:
            </p>
            <ol>
              <li><strong>Upload</strong> — Create import set with raw rows</li>
              <li><strong>Map</strong> — Define column-to-field mappings</li>
              <li><strong>Validate</strong> — Check required fields and data types</li>
              <li><strong>Preview</strong> — Review valid records before commit</li>
              <li><strong>Commit</strong> — Insert into target entity tables</li>
              <li><strong>Retry</strong> — Reprocess error rows after fixing mappings</li>
            </ol>

            <h2>Notifications</h2>
            <p>
              Automatic in-app notifications triggered by audit events:
            </p>
            <ul>
              <li>Team members notified when their team's entities are created, updated, or deleted</li>
              <li>Bell icon in header with unread count badge</li>
              <li>Notifications page with mark-read and read-all actions</li>
              <li>Auto-refresh on tab focus regained</li>
            </ul>

            <h2>Full-Text Search</h2>
            <p>
              SQLite FTS5 full-text search across services, applications, and CIs:
            </p>
            <ul>
              <li>Relevance-ranked results with <code>MATCH</code> queries</li>
              <li>Type filter (<code>?type=service</code>)</li>
              <li>Autocomplete suggest API with debounced typeahead</li>
            </ul>

            <h2>Dark Mode & Themes</h2>
            <p>
              Eight built-in themes with dual light/dark token sets:
            </p>
            <ul>
              <li>Blue Line (default)</li>
              <li>Catppuccin Latte, Frappé, Macchiato, Mocha</li>
              <li>Nord, Dracula, Cyberpunk</li>
            </ul>
          </>
        )}

        {/* DEPLOYMENT */}
        {active === 'deployment' && (
          <>
            <h1>Deployment</h1>

            <h2>Environment Variables</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Required</th>
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>JWT_SECRET</code></td><td>Production only</td><td><code>atlas-dev-secret-...</code></td></tr>
                <tr><td><code>JWT_REFRESH_SECRET</code></td><td>Production only</td><td><code>atlas-refresh-dev-secret-...</code></td></tr>
                <tr><td><code>JWT_EXPIRES_IN</code></td><td>No</td><td><code>15m</code></td></tr>
                <tr><td><code>JWT_REFRESH_EXPIRES_IN</code></td><td>No</td><td><code>7d</code></td></tr>
                <tr><td><code>DATABASE_URL</code></td><td>Production</td><td><code>./data/atlas.db</code></td></tr>
                <tr><td><code>BASE_URL</code></td><td>Production</td><td><code>http://localhost:3000</code></td></tr>
              </tbody>
            </table>

            <h2>Docker Compose</h2>
            <CodeBlock language="yaml">{`version: '3.8'
services:
  atlas:
    image: atlas-cmdb:latest
    ports:
      - '3000:3000'
    environment:
      - JWT_SECRET=\${JWT_SECRET}
      - JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET}
      - DATABASE_URL=\${DATABASE_URL}
      - BASE_URL=https://cmdb.example.com
    volumes:
      - atlas-data:/app/data
    restart: unless-stopped

volumes:
  atlas-data:`}</CodeBlock>

            <h2>Kubernetes</h2>
            <CodeBlock language="yaml">{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: atlas-cmdb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: atlas-cmdb
  template:
    metadata:
      labels:
        app: atlas-cmdb
    spec:
      containers:
        - name: atlas
          image: atlas-cmdb:latest
          ports:
            - containerPort: 3000
          env:
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: atlas-secrets
                  key: jwt-secret
            - name: JWT_REFRESH_SECRET
              valueFrom:
                secretKeyRef:
                  name: atlas-secrets
                  key: jwt-refresh-secret
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: atlas-secrets
                  key: database-url
            - name: BASE_URL
              value: "https://cmdb.example.com"
          volumeMounts:
            - name: data
              mountPath: /app/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: atlas-data-pvc`}</CodeBlock>

            <h2>Standalone (Node.js)</h2>
            <CodeBlock language="bash">{`# Install dependencies
npm install

# Option A — Blank install (no demo data)
# Creates the database schema + one admin account only.
npm run db:init

# Option B — Demo install (full sample data)
# Creates schema + sample services, CIs, assets, users, etc.
# WARNING: destroys any existing data.
npm run db:setup

# Build for production
npm run build

# Start the server
npm start

# The app runs on http://localhost:3000
# Default login (both options): alice@atlas.local / password123`}</CodeBlock>
          </>
        )}
      </div>
    </div>
  );
}
