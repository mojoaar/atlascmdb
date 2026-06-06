'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Search, X } from 'lucide-react';
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
  { id: 'user-management', label: 'User Management' },
  { id: 'portal-admin', label: 'Portal vs Admin' },
  { id: 'themes', label: 'Themes & Dark Mode' },
  { id: 'audit-trail', label: 'Audit Trail' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'auth', label: 'Auth & RBAC' },
  { id: 'sso', label: 'SSO Integration' },
  { id: 'scim-setup', label: 'SCIM Setup' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'entities', label: 'Entity Types' },
  { id: 'service', label: 'Services', indent: true },
  { id: 'application', label: 'Applications', indent: true },
  { id: 'ci', label: 'CIs', indent: true },
  { id: 'ci-classes', label: 'CI Classes', indent: true },
  { id: 'asset', label: 'Assets', indent: true },
  { id: 'attachments', label: 'Attachments', indent: true },
  { id: 'api-reference', label: 'API Reference' },
  { id: 'search-filter', label: 'Search & Filter' },
  { id: 'data-model', label: 'Data Model' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'database', label: 'Database & Backup' },
  { id: 'changelog', label: 'Changelog' },
];

const SEARCH_INDEX = [
  {
    id: 'overview',
    label: 'Overview',
    content: 'atlas cmdb documentation open-source cmdb for modern it teams centralized system infrastructure services applications configuration items cis assets teams locations relationships next.js 16 react 19 default admin account alice@atlas.local password123 interfaces admin portal command reference npm run dev start dev server turbopack npm run build production build npm run test run test suite vitest npm run db:setup reset db drop migrate seed npm run lint run linter'
  },
  {
    id: 'features',
    label: 'Features',
    content: 'form designer per-class ci layouts rack layout rack form editor relationship graph location maps dashboard analytics bulk operations data import pipeline notifications full-text search dark mode themes drag-and-drop field reordering cross-section custom sections columns relationships audit trail reset default layouts form_layout_* visual u-slot grid 42u 48u front back toggle dual-sided rack mounting hosted_on relationship auto-creation overlap prevention xyflow react dagrejs minimap zoom pan leaflet cartodb dark tiles recharts pie chart line chart bulk delete csv json import upload map validate preview commit retry in-app notifications team members bell icon unread count badge autocomplete matches fts5'
  },
  {
    id: 'user-management',
    label: 'User Management',
    content: 'managing accounts creating new user email status active inactive suspended disable password reset bcryptjs manager hierarchy managerid multi-factor authentication mfa totp setup qr code verification code authenticator google authenticator microsoft authenticator 1password recovery admin revocation reset mfa device avatars personalization color swatches 14 colors custom photo upload 2mb limit file format png jpg jpeg gif webp binary blob database storage'
  },
  {
    id: 'portal-admin',
    label: 'Portal vs Admin',
    content: 'capabilities matrix viewer editor admin access dashboard analytics read services cis assets locations relationships maps graph create edit form designer user roles permissions settings reset demo data sso scim config navigation rules hide admin link user section sidebar portal logout only'
  },
  {
    id: 'themes',
    label: 'Themes & Dark Mode',
    content: 'visual engine dual-mode palettes eight built-in themes blue line default catppuccin latte frappe macchiato mocha nord dracula cyberpunk light mode overrides dark mode overrides data-theme="dark" contrast ratio 4.5:1 primary foreground accent sidebaractive sidebar active foreground flip text colors accessibility localstorage persistence multi-tab synchronization PUT /api/me/theme atlas-theme-mode login_ascii_logo ascii logo branding login screen public config'
  },
  {
    id: 'audit-trail',
    label: 'Audit Trail',
    content: 'compliance reliability logaudit hook write ops audit_events table actor identity actoruserid target modify state snapshot beforedata afterdata json snapshot timeline revisions audit trail component form designer security read-only immutable no api edit delete impersonation administrator tracks real actor'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    content: 'in-app notification team ownership team_members notifications table unread badging count badge bell icon dismissal mark read mark all as read auto-sync focus regained active tab focus refresh'
  },
  {
    id: 'auth',
    label: 'Auth & RBAC',
    content: 'authentication rbac security jwt cookies bearer token programmatic access refresh tokens sessions table session rotation mismatch jwt_expires_in jwt_refresh_expires_in mfa totp setup otpauth qr code setup confirm verification code impersonation troubleshoot verify active banner banner menu end session un-impersonate portal admin editor viewer direct user roles team-inherited roles highest role resolution user_roles team_members'
  },
  {
    id: 'sso',
    label: 'SSO Integration',
    content: 'oidc openid connect single sign-on pkce s256 microsoft entra id azure ad keycloak configuration admin settings sso settings sso enabled issuer url client id client secret redirect uri callback certificates directory tenant id realm openid-connect confidential'
  },
  {
    id: 'scim-setup',
    label: 'SCIM Setup',
    content: 'system for cross-domain identity management scim v2.0 rfc 7643 rfc 7644 user group provisioning identity provider idp okta microsoft entra id bearer token configuration active settings generate token random token save scim base url userName email push new users push profile updates push groups authorization bearer test connection group mappings team_members groups schema endpoints users'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    content: 'integrations connectors external systems data import sync next insight enterprise architecture api key bearer token pull-only pull write-back conflict resolution overwrite merge fill empty skip per-connector per-field global mode field overrides override table applications services relationships sync logs history dashboard enabled toggle test connection credentials masked plaintext base url SSO single sign-on OIDC PKCE SCIM provisioning identity providers keycloak entra id okta admin settings configuration page Plug2 icon'
  },
  {
    id: 'entities',
    label: 'Entity Types',
    content: 'entity types primary types services business technical criticality tier support model applications vendor version technology stack configuration items cis physical virtual servers network devices databases containers racks assets hardware licenses equipment cost warranty assignment tracking teams locations users roles themes api'
  },
  {
    id: 'service',
    label: 'Services',
    content: 'services represent business technical capabilities service_base business_services technical_services table inheritance shared columns type-specific fields endpoints GET POST PATCH DELETE /api/services field reference name description ownerteamid lifecyclestatus environment classification businesscriticality businessowner servicetier supportmodel servicecategory'
  },
  {
    id: 'application',
    label: 'Applications',
    content: 'applications software systems versions vendors technology stack application_base applications table inheritance shared columns app-specific fields endpoints GET POST PATCH DELETE /api/applications field reference name description ownerteamid lifecyclestatus environment classification vendor version apptype technologystack'
  },
  {
    id: 'ci',
    label: 'CIs',
    content: 'configuration items cis physical virtual infrastructure components ci_base cis table inheritance shared columns ci-specific fields endpoints GET POST PATCH DELETE /api/cis field reference name description ownerteamid locationid lifecyclestatus environment classification externalref citype serialnumber assettag racksize rackmodel'
  },
  {
    id: 'ci-classes',
    label: 'CI Classes',
    content: 'ci classes layouts citype server network device storage database container rack other physical servers virtual machines cloud instances aws ec2 azure vm routers switches firewalls load balancers san nas disks logical oracle postgresql ms sql mongodb pods docker runtimes datacenter mounts rack size model shared schema specialized layouts form designer layout keys form_layout_ci:database form_layout_ci:server fallback form_layout_ci'
  },
  {
    id: 'asset',
    label: 'Assets',
    content: 'assets hardware software licenses equipment linked ci ownership tracking file attachments invoices warranties configuration documents endpoints GET POST PATCH DELETE /api/assets field reference name assettag model category status ciid locationid assignedto supplier purchasedate warrantyexpiry cost notes'
  },
  {
    id: 'attachments',
    label: 'Attachments',
    content: 'attachments upload files assets pdf doc docx xls xlsx csv txt png jpg jpeg gif webp svg attachment settings mime types binary data blob asset_attachments table s3 database size restriction 2mb mime masking cross-site scripting xss vulnerabilities forced download application/octet-stream x-content-type-options nosniff drag drop remove delete'
  },
  {
    id: 'api-reference',
    label: 'API Reference',
    content: 'rest api reference rest explorer sidebar apidocs menu cookie auth session auth bearer token programmatic auth authorization bearer json envelope wrap pagination total limit offset sort order conditions filter query string ?filter= startsWith eq neq contains isEmpty conditional operators error format error message statuscode conflict 409'
  },
  {
    id: 'search-filter',
    label: 'Search & Filter',
    content: 'fts5 global search sqlite virtual fts5 relevance ranking autocomplete search suggest autocomplete suggest debounced suggest builder rule multi-column filters toolbar column selector logical rules query bulk export not yet supported csv download pagination'
  },
  {
    id: 'data-model',
    label: 'Data Model',
    content: 'data model database tables 33 tables table inheritance core tables supporting tables users roles user_roles teams team_members locations relationships assets sessions audit_events themes user_theme_preferences app_config notifications import_sets import_rows import_mappings attachments asset_attachments rack_placements integration_connectors integration_sync_logs service_fts application_fts ci_fts fts5 triggers'
  },
  {
    id: 'relationships',
    label: 'Relationships',
    content: 'relationships connections between entities interactive relationship graph relationships table sourcetype sourceid targettype targetid relationshiptype direction outbound inbound bidirectional notes depends_on hosted_on owned_by part_of connects_to uses graph visualization xyflow react dagrejs depth minimap zoom pan center node highlighted deep pink color-coded depth'
  },
  {
    id: 'deployment',
    label: 'Deployment',
    content: 'deployment environment variables production default credentials jwt_secret jwt_refresh_secret jwt_expires_in jwt_refresh_expires_in database_url base_url docker compose volume kubernetes manifest deployment pvc secrets standalone node.js installation npm install db:init db:setup build start local server'
  },
  {
    id: 'database',
    label: 'Database & Backup',
    content: 'database storage sqlite better-sqlite3 write-ahead logging wal mode connection pool db/knexfile.js max pool min pool SQLite backup vacuum into atlas.db atlas.db-shm atlas.db-wal postgresql database_url npm run db:init schema npm run db:setup migration path manual cross-dialect migration export re-import'
  },
  {
    id: 'changelog',
    label: 'Changelog',
    content: 'changelog features optimizations bug fixes initial public release 0.1.0 jwt authentication session controls rbac admin editor viewer polymorphic table inheritance drag drop form designer xyflow relationship graphs leaflet location maps audit trail notifications rack layout editor'
  }
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);

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

  // Pure word-matching and scoring search logic
  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);

    return SEARCH_INDEX.map(section => {
      let score = 0;
      const content = section.content;
      const label = section.label.toLowerCase();

      // Full phrase matches
      if (label.includes(q)) score += 5;
      else if (content.includes(q)) score += 3;

      // Word matches (AND vs OR)
      let wordMatches = 0;
      words.forEach(w => {
        if (label.includes(w) || content.includes(w)) {
          wordMatches++;
        }
      });

      if (wordMatches === words.length) {
        score += 2; // All terms present
      } else if (wordMatches > 0) {
        score += 1; // Partial terms present
      }

      if (score === 0) return null;

      // Slice out 120-character excerpt context
      let excerpt = '';
      const matchIdx = content.indexOf(words[0]);
      if (matchIdx !== -1) {
        const start = Math.max(0, matchIdx - 50);
        const end = Math.min(content.length, matchIdx + 70);
        excerpt = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
      } else {
        excerpt = section.content.substring(0, 120) + '...';
      }

      // Generate segments to support styled highlighting
      const regex = new RegExp(`(${words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'gi');
      const segments = excerpt.split(regex);

      return {
        ...section,
        score,
        excerptParts: segments
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  }, [query]);

  // Reset keyboard selection on query change
  useEffect(() => {
    setPaletteIndex(0);
  }, [query]);

  // Handle shortcut events globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        setQuery('');
      }

      if (!paletteOpen) return;

      if (e.key === 'Escape') {
        setPaletteOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPaletteIndex(prev => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPaletteIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[paletteIndex]) {
          setActive(results[paletteIndex].id);
          setPaletteOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paletteOpen, results, paletteIndex]);

  return (
    <div className={styles.docs}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>Contents</div>
          <div className={styles.searchAndToggle}>
            <button 
              className={styles.searchButton} 
              onClick={() => { setPaletteOpen(true); setQuery(''); }} 
              aria-label="Search documentation"
            >
              <Search size={14} />
              <span className={styles.tooltip}>Search (⌘K / Ctrl+K)</span>
            </button>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
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
              Config keys follow the pattern <code>form_layout_ci:{"{ciType}"}</code> —
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
              <li>Side-by-side front and back columns with a centered U-number lane</li>
              <li>Hover tooltips showing detailed CI placement info (name, type, serial number, and U-range)</li>
              <li>Dedicated full-screen layout viewer at <code>/admin/racks/[id]/layout</code></li>
              <li>Place any CI from <code>ci_base</code> into rack slots (single or multi-U)</li>
              <li>Auto-detection of occupied slots with overlap prevention</li>
              <li>Color-coded CI type badges (server, network, storage, database, container)</li>
              <li>Relationship auto-creation: placing a CI in a rack creates a <code>hosted_on</code> relationship</li>
              <li>Manage placements via <code>/api/cis/{"{id}"}/rack-placements</code></li>
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
              <li>RElevance-ranked results with <code>MATCH</code> queries</li>
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

        {/* USER MANAGEMENT */}
        {active === 'user-management' && (
          <>
            <h1>User Management</h1>
            <p>
              Atlas provides robust, multi-faceted administration of user accounts, and can be managed directly
              by administrators via the <strong>Admin → Users</strong> section.
            </p>

            <h2>Managing Accounts</h2>
            <ul>
              <li><strong>Account Creation:</strong> Click the "New User" button, fill in their name, email, status, manager, and set an initial password.</li>
              <li><strong>Disabling Accounts:</strong> Modify a user's status to <code>inactive</code> or <code>suspended</code> to immediately terminate active sessions and block further logins.</li>
              <li><strong>Passwords:</strong> Administrators can reset a user's password directly from their profile page. Password hashing is secured via bcryptjs.</li>
            </ul>

            <h2>Manager Hierarchy</h2>
            <p>
              Each user can be assigned a manager. This structures reporting relationships and hierarchical escalation
              within the organization, which is utilized for team ownership representation and resource mapping.
            </p>

            <h2>Multi-Factor Authentication (MFA)</h2>
            <p>
              Atlas supports standard Time-Based One-Time Password (TOTP) multi-factor authentication:
            </p>
            <ul>
              <li><strong>User Self-Enrollment:</strong> Users can enroll in MFA from their <strong>Portal → Settings</strong> page. This presents a QR code compatible with standard authenticator apps (Google Authenticator, Microsoft Authenticator, 1Password, etc.) and requires a successful verification code to activate.</li>
              <li><strong>Administrative Management:</strong> If a user loses access to their MFA device, administrators can revoke the MFA requirement directly from the user's details page under Admin Settings, restoring the account to single-factor password login.</li>
            </ul>

            <h2>Avatars and Personalization</h2>
            <p>
              Users can personalize their visual presence with custom avatars:
            </p>
            <ul>
              <li><strong>Colour Swatches:</strong> Users can choose from a grid of 14 built-in system colors (representing various dark and light options) to render automated initials-based avatars.</li>
              <li><strong>Photo Upload:</strong> Users can upload their own custom avatar image file (JPG, PNG, GIF, or WebP). Uploaded files are strictly checked against a 2MB size limit and stored directly in the database as binary data (blobs) for simplified environment-independent deployment.</li>
            </ul>
          </>
        )}

        {/* PORTAL VS ADMIN */}
        {active === 'portal-admin' && (
          <>
            <h1>Portal vs Admin Interfaces</h1>
            <p>
              To maintain simple, high-performance interactions, Atlas separates operational reading and analytics from admin configuration.
            </p>

            <h2>Role-Based Capabilities Matrix</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Capability / Feature</th>
                  <th>viewer (Portal)</th>
                  <th>editor (Portal + Admin)</th>
                  <th>admin (Portal + Admin)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Access Dashboard & Analytics</strong></td>
                  <td>Read-Only (Portal)</td>
                  <td>Read-Only (Portal)</td>
                  <td>Read-Only (Portal)</td>
                </tr>
                <tr>
                  <td><strong>Read Services, CIs, Assets, Locations</strong></td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td><strong>Relationship Graph & Maps</strong></td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td><strong>Create / Edit Services, CIs, Assets, Locations</strong></td>
                  <td>No</td>
                  <td>Yes (Admin panel)</td>
                  <td>Yes (Admin panel)</td>
                </tr>
                <tr>
                  <td><strong>Access Form Designer Layouts</strong></td>
                  <td>No</td>
                  <td>No</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td><strong>Manage Users, Roles, and Permissions</strong></td>
                  <td>No</td>
                  <td>No</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td><strong>Wipe / Reset Demo Data</strong></td>
                  <td>No</td>
                  <td>No</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td><strong>SSO & SCIM Server Configuration</strong></td>
                  <td>No</td>
                  <td>No</td>
                  <td>Yes</td>
                </tr>
              </tbody>
            </table>

            <h2>Navigation Rules</h2>
            <ul>
              <li><strong>Viewers:</strong> See only the Portal interface. The bottom user sidebar hides the "Admin" link entirely; only the "Portal" and "Logout" actions are visible.</li>
              <li><strong>Editors:</strong> Have access to both interfaces. The admin dashboard is accessible, but sensitive system folders (Users, Roles, SSO/SCIM &amp; Integrations) are fully restricted.</li>
              <li><strong>Admins:</strong> Enjoy unrestricted administrative control.</li>
            </ul>
          </>
        )}

        {/* THEMES & DARK MODE */}
        {active === 'themes' && (
          <>
            <h1>Themes & Dark Mode</h1>
            <p>
              Atlas features a fully customizable visual engine powered by dual-mode visual palettes.
            </p>

            <h2>Eight Built-In Themes</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Theme Name</th>
                  <th>Aesthetic Style</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Blue Line (Default)</strong></td><td>Corporate navy blue with crisp highlights</td></tr>
                <tr><td><strong>Catppuccin Latte</strong></td><td>Soft, clean light pastel palette</td></tr>
                <tr><td><strong>Catppuccin Frappé</strong></td><td>Subdued dark pastel palette</td></tr>
                <tr><td><strong>Catppuccin Macchiato</strong></td><td>Balanced, rich dark pastel palette</td></tr>
                <tr><td><strong>Catppuccin Mocha</strong></td><td>Sleek, deep dark pastel palette</td></tr>
                <tr><td><strong>Nord</strong></td><td>Arctic ice cold gray-blue tones</td></tr>
                <tr><td><strong>Dracula</strong></td><td>High-contrast gothic purple and pink cyberpunk theme</td></tr>
                <tr><td><strong>Cyberpunk</strong></td><td>Vibrant neon pink, cyan, and deep navy accents</td></tr>
              </tbody>
            </table>

            <h2>Dual-Mode Architecture</h2>
            <p>
              Each theme in the database defines both light and dark variations inside a single database row:
            </p>
            <ul>
              <li><strong>Light Mode overrides:</strong> Set properties when <code>data-theme</code> is empty.</li>
              <li><strong>Dark Mode overrides:</strong> Apply when <code>data-theme="dark"</code> is added to the root <code>html</code> element.</li>
              <li><strong>Legible Contrasts:</strong> Themes are audited to guarantee contrast ratios of at least 4.5:1. Primary and accent foregrounds are flipped dynamically on theme switches to prevent dark-text-on-dark-button formatting bugs.</li>
            </ul>

            <h2>Persistence & Multi-Tab Synchronization</h2>
            <p>
              When a user switches theme options or toggles light/dark mode:
            </p>
            <ol>
              <li>The browser writes the choice to <code>localStorage</code> (key: <code>atlas-theme-mode</code>).</li>
              <li>The application updates the database preference via <code>PUT /api/me/theme</code>.</li>
              <li>Other open tabs (like Docs and API documentation which run in isolated sandboxes) read from <code>localStorage</code> on load, ensuring a synchronized user experience across windows without requiring active database queries.</li>
            </ol>

            <h2>Login Screen Branding</h2>
            <p>
              In addition to UI theme overrides, administrators can customize the login screen's appearance:
            </p>
            <ul>
              <li><strong>ASCII Logo Toggle:</strong> Administrators can toggle on the Atlas ASCII art logo under <strong>Admin &rarr; Settings &rarr; Login Screen</strong>.</li>
              <li><strong>Public Config API:</strong> When enabled, the unauthenticated route <code>GET /api/config/public</code> serves <code>login_ascii_logo: "true"</code>. The login client checks this endpoint on load to render the responsive border box with standard figlet characters instead of standard heading text.</li>
            </ul>
          </>
        )}

        {/* AUDIT TRAIL */}
        {active === 'audit-trail' && (
          <>
            <h1>Audit Trail</h1>
            <p>
              Compliance and reliability are maintained through an immutable, automatic audit logging subsystem.
            </p>

            <h2>Captured Details</h2>
            <p>
              Any state change (POST, PATCH, DELETE operations) on services, applications, CIs, assets, locations, and relationships executes a hook that writes a row to the <code>audit_events</code> table:
            </p>
            <ul>
              <li><strong>Actor Identity:</strong> The specific user who performed the operation, logged as <code>actorUserId</code>.</li>
              <li><strong>Target:</strong> The entity type and UUID that was modified.</li>
              <li><strong>Action Type:</strong> <code>created</code>, <code>updated</code>, or <code>deleted</code>.</li>
              <li><strong>Data Snapshots:</strong>
                <ul>
                  <li><code>beforeData</code>: A full JSON snapshot of the database record prior to the update (empty for creations).</li>
                  <li><code>afterData</code>: A full JSON snapshot of the database record after the update (empty for deletions).</li>
                </ul>
              </li>
            </ul>

            <h2>Viewing Logs</h2>
            <p>
              Every detail page for a primary entity (such as CIs, Services, Applications, and Assets) includes an <strong>Audit Trail</strong> component at the bottom of the page. This component is customizable via the Form Designer, and displays a chronologically sorted timeline of revisions.
            </p>

            <h2>Security and Integrity</h2>
            <p>
              The audit trail is read-only. There are no API endpoints or interface mechanisms to modify or delete audit rows, ensuring full tamper-proof logging. If a user is being impersonated by an administrator, the audit log records the <strong>actual administrator</strong> as the actor, preventing untraceable modifications under impersonation.
            </p>
          </>
        )}

        {/* NOTIFICATIONS */}
        {active === 'notifications' && (
          <>
            <h1>Notifications</h1>
            <p>
              Atlas includes an in-app notification system that automatically keeps teams informed when changes affect the infrastructure they own.
            </p>

            <h2>Automatic Triggers</h2>
            <p>
              Notifications are generated in real-time when an entity with an assigned <code>ownerTeamId</code> is modified:
            </p>
            <ul>
              <li>When a Service, Application, CI, or Asset is created, updated, or deleted, the system identifies the owning team.</li>
              <li>All users assigned to that team in the <code>team_members</code> table are immediately targeted.</li>
              <li>An in-app notification is inserted into the <code>notifications</code> table.</li>
            </ul>

            <h2>User Experience</h2>
            <ul>
              <li><strong>Unread Badging:</strong> A red badge appears over the bell icon in the top header displaying the count of unread messages.</li>
              <li><strong>Mark as Read:</strong> Users can mark individual notifications as read or choose "Mark All as Read" to clear the badge.</li>
              <li><strong>Dismissal &amp; Deletion:</strong> Clicking the trash icon next to any notification permanently deletes/dismisses that notification.</li>
              <li><strong>Focus Auto-Sync:</strong> The notifications component registers a browser window listener. When a user switches tabs and returns to Atlas, the system automatically triggers a silent refresh, syncing notifications instantly.</li>
            </ul>

            <h2>Preferences &amp; Customization</h2>
            <p>
              Users can customize which automatic triggers send notifications to their account. Under <strong>Portal Settings &gt; Notifications</strong>, three global switches allow users to opt in or out of specific event types:
            </p>
            <ul>
              <li><strong>Item Created:</strong> Control notifications sent when a new managed item (Service, CI, Application, or Asset) you own is created.</li>
              <li><strong>Item Updated:</strong> Control notifications sent when an item you own is modified.</li>
              <li><strong>Item Deleted:</strong> Control notifications sent when an item you own is deleted.</li>
            </ul>
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
              SCIM v2 endpoints are available for user and group provisioning. See the
              dedicated <a href="#scim-setup" onClick={(e) => { e.preventDefault(); setActive('scim-setup'); }}>SCIM Setup</a> section
              for a complete configuration guide.
            </p>
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
              Navigate to <strong>Admin → Integrations → SSO Settings</strong> to enable and configure:
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

        {/* SCIM SETUP */}
        {active === 'scim-setup' && (
          <>
            <h1>SCIM Setup</h1>
            <p>
              System for Cross-domain Identity Management (SCIM v2.0, RFC 7643/7644) allows you to automate user
              and group provisioning directly from an Identity Provider (IdP) such as Okta or Microsoft Entra ID.
            </p>

            <h2>Enabling SCIM in Atlas</h2>
            <ol>
              <li>Log in as an Administrator and navigate to <strong>Admin → Integrations → SCIM Configuration</strong>.</li>
              <li>Toggle the SCIM Enabled setting to true.</li>
              <li>Click <strong>Generate Token</strong> to obtain a cryptographically secure, random bearer token. Save this token immediately as it is masked upon reload.</li>
              <li>Click <strong>Save SCIM Settings</strong> to apply the config to the database.</li>
            </ol>

            <h2>Okta Integration Walkthrough</h2>
            <ol>
              <li>In your Okta Admin dashboard, create a new Custom Integration or add an app supporting SCIM.</li>
              <li>Set the SCIM connector base URL to: <code>https://your-domain.com/api/scim/v2</code></li>
              <li>Set the Unique identifier field for users to: <code>userName</code> (which maps to Email in Atlas).</li>
              <li>Select supported operations: <strong>Push New Users</strong>, <strong>Push Profile Updates</strong>, and <strong>Push Groups</strong>.</li>
              <li>Set the authentication type to <strong>HTTP Header</strong>, pasting your generated token in the Authorization Bearer field.</li>
              <li>Save and test connectivity. Okta will automatically provision users, sync group membership to Atlas Teams, and handle deprovisioning.</li>
            </ol>

            <h2>Microsoft Entra ID (Azure AD) Integration</h2>
            <ol>
              <li>In Entra ID, select <strong>Enterprise Applications</strong> → <strong>New Application</strong> → <strong>Non-gallery application</strong>.</li>
              <li>Navigate to <strong>Provisioning</strong> and set the Mode to <strong>Automatic</strong>.</li>
              <li>Enter Tenant URL: <code>https://your-domain.com/api/scim/v2</code></li>
              <li>Enter the Secret Token generated from Atlas.</li>
              <li>Click <strong>Test Connection</strong>. Under Mappings, configure Azure AD Users to map to SCIM Users, and Azure AD Groups to SCIM Groups.</li>
            </ol>

            <h2>SCIM v2.0 Endpoints</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>GET</code></td><td><code>/api/scim/v2/Users</code></td><td>Query users list with filtering</td></tr>
                <tr><td><code>POST</code></td><td><code>/api/scim/v2/Users</code></td><td>Provision a new user account</td></tr>
                <tr><td><code>GET</code></td><td><code>/api/scim/v2/Users/:id</code></td><td>Retrieve detailed user record</td></tr>
                <tr><td><code>PUT / PATCH</code></td><td><code>/api/scim/v2/Users/:id</code></td><td>Update user attributes (name, status, email)</td></tr>
                <tr><td><code>DELETE</code></td><td><code>/api/scim/v2/Users/:id</code></td><td>Delete user account (or set inactive)</td></tr>
                <tr><td><code>GET</code></td><td><code>/api/scim/v2/Groups</code></td><td>Query groups/teams list</td></tr>
                <tr><td><code>POST</code></td><td><code>/api/scim/v2/Groups</code></td><td>Create a new team group</td></tr>
                <tr><td><code>GET / PUT / PATCH</code></td><td><code>/api/scim/v2/Groups/:id</code></td><td>Query, rename, or sync group memberships</td></tr>
                <tr><td><code>DELETE</code></td><td><code>/api/scim/v2/Groups/:id</code></td><td>Delete group alignment</td></tr>
              </tbody>
            </table>
          </>
        )}

        {/* INTEGRATIONS */}
        {active === 'integrations' && (
          <>
            <h1>Integrations</h1>
            <p>
              The Integrations page (<code>/admin/integrations</code>) provides a centralized hub for connecting Atlas
              to external systems. SSO and SCIM authentication configs have moved here alongside data connectors.
            </p>

            <h2>Connectors</h2>
            <p>
              Data connectors pull services, applications, and relationships from external tools into Atlas.
              Each connector authenticates via a bearer token (API key) stored in the database and masked
              in the UI and audit logs — the same approach used for SSO client secrets and SCIM tokens.
            </p>

            <h3>Conflict Resolution</h3>
            <p>
              When syncing, Atlas compares incoming data against existing records matched by <code>externalRef</code>.
              The conflict mode determines what happens to overlapping fields:
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Behaviour</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Merge</strong> (default)</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Fill empty fields only — existing data is never overwritten</td>
                </tr>
                <tr>
                  <td><strong>Overwrite</strong></td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Always replace the Atlas value with the incoming value</td>
                </tr>
                <tr>
                  <td><strong>Skip</strong></td>
                  <td style={{ color: 'var(--muted-foreground)' }}>Never write this field — kept for read-only reference</td>
                </tr>
              </tbody>
            </table>

            <p>
              A <strong>global mode</strong> sets the default for all fields, and each individual
              field can override that setting in the <strong>Field Conflict Overrides</strong> table.
            </p>

            <h3>Sync Flow</h3>
            <ul>
              <li>The connector fetches a paginated list from the external API using the configured base URL and bearer token</li>
              <li>Each record is mapped from the external schema to Atlas&apos;s internal field names</li>
              <li>Records matching an existing <code>externalRef</code> are updated; unmatched records are created</li>
              <li>The connector respects per-field conflict modes when merging data</li>
              <li>A sync log entry records the result: created, updated, skipped, and errored counts</li>
            </ul>

            <h3>Next Insight</h3>
            <p>
              <strong>Next Insight</strong> is the first supported connector — an enterprise architecture
              management tool whose REST API provides applications, services, and their relationships.
            </p>
            <ul>
              <li>API authentication: Bearer token in the <code>Authorization</code> header</li>
              <li>Syncable entities: Applications, Services (business &amp; technical), Relationships</li>
              <li>Configurable per-field conflict resolution for all app and service columns</li>
              <li>Test Connection button validates URL and credentials before first sync</li>
            </ul>

            <h2>SSO & SCIM</h2>
            <p>
              Single Sign-On (OIDC PKCE) and SCIM v2.0 provisioning are configured below the
              connector cards on the same Integrations page. Their configuration keys
              (<code>sso_enabled</code>, <code>oidc_*</code>, <code>scim_enabled</code>, <code>scim_bearer_token</code>)
              are stored in the <code>app_config</code> table alongside connector config.
            </p>

            <h3>SSO Providers</h3>
            <ul>
              <li>OpenID Connect (PKCE S256) — openid-client v6</li>
              <li>Tested against Microsoft Entra ID (Azure AD) and Keycloak</li>
              <li>SSO login redirects unauthenticated users automatically when enabled</li>
            </ul>

            <h3>SCIM v2.0</h3>
            <ul>
              <li>RFC 7643 / RFC 7644 compliant</li>
              <li>Bearer token authentication — generate and copy the token, then enter it in your IdP (Okta, Entra ID)</li>
              <li>Users and Groups endpoints auto-create accounts and populate team memberships</li>
              <li>SCIM base URL: <code>https://your-atlas.example.com/api/scim/v2</code></li>
            </ul>

            <h2>Enabled Connector Badge</h2>
            <p>
              Each connector card includes a toggle to enable/disable sync. Disabled connectors
              can still be edited and tested but will reject sync requests.
            </p>

            <h2>Future Connectors</h2>
            <p>
              The connector framework is extensible — additional modules
              for ServiceNow, Azure Cloud, GCP, Proxmox, vCenter, and Hyper‑V
              will plug into the same UI, conflict-resolution engine, and sync log system.
            </p>
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
                  <td>Yes — 13 fields</td>
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

        {/* CI CLASSES */}
        {active === 'ci-classes' && (
          <>
            <h1>CI Classes & Layouts</h1>
            <p>
              To handle highly diverse hardware, networks, and cloud resources, Configuration Items
              in Atlas are categorized into <strong>CI Classes</strong> via the <code>ciType</code> property.
            </p>

            <h2>Supported CI Classes</h2>
            <ul>
              <li><strong>Server:</strong> Physical servers, virtual machines, cloud instances (AWS EC2, Azure VM, etc.).</li>
              <li><strong>Network Device:</strong> Routers, core switches, firewalls, load balancers, access points.</li>
              <li><strong>Storage:</strong> SAN/NAS storage arrays, physical hard disk enclosures, cloud buckets.</li>
              <li><strong>Database:</strong> Logical instances of databases (Oracle, PostgreSQL, MS SQL, MongoDB).</li>
              <li><strong>Container:</strong> Kubernetes pods, Docker containers, container runtimes.</li>
              <li><strong>Rack:</strong> Enclosures for datacenter mounts (utilizes the visual 42U/48U rack designer).</li>
              <li><strong>Other:</strong> Generic peripherals, UPS backups, peripheral office inventory.</li>
            </ul>

            <h2>Shared Schema, Specialized Layouts</h2>
            <p>
              All CI classes share a common set of 13 attributes in the database.
              Specialized fields for racks (<code>rackSize</code> and <code>rackModel</code>) are visible only when
              the CI's type is designated as <code>rack</code>.
            </p>
            <p>
              The visual representation of these fields is controlled via **Form Designer**. Each CI Type
              can have its own saved configuration key:
            </p>
            <CodeBlock language="text">{`Config Key Format: form_layout_ci:{ciType}
Fallback Key:      form_layout_ci`}</CodeBlock>
            <p>
              When a user edits a layout, Atlas automatically saves it to that class's unique layout key.
              For example, editing a database CI's form layout saves it to <code>form_layout_ci:database</code>.
              Other databases will instantly inherit this layout, while servers continue to use their own layout key,
              providing highly relevant layouts tailored to each individual infrastructure type.
            </p>
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

        {/* ATTACHMENTS */}
        {active === 'attachments' && (
          <>
            <h1>File Attachments</h1>
            <p>
              Asset and entity management often requires supporting documentation such as purchase agreements, licenses,
              invoices, and spec sheets. Atlas supports uploading files directly to Asset records.
            </p>

            <h2>Configuration & Security</h2>
            <p>
              Administrators can configure attachment constraints in <strong>Admin → Settings → Attachment Settings</strong>:
            </p>
            <ul>
              <li><strong>File Types:</strong> A white space-separated string of allowed file extensions. Default list is:
                <code>.pdf .doc .docx .xls .xlsx .csv .txt .png .jpg .jpeg .gif .webp .svg</code>.
              </li>
              <li><strong>Storage Strategy:</strong> Files are stored directly in the database as binary data (<code>BLOB</code>) inside the <code>asset_attachments</code> table. This keeps deployments simple and removes dependencies on external Amazon S3 buckets or local write permissions.</li>
              <li><strong>Size Restriction:</strong> Standard uploads are subject to a 2MB maximum limit to ensure high-performance DB queries.</li>
              <li><strong>MIME Masking:</strong> To prevent Cross-Site Scripting (XSS) vulnerabilities, dangerous mime types like SVG, HTML, or JavaScript are stripped upon download, forcing browser overrides to <code>application/octet-stream</code> with header protection <code>X-Content-Type-Options: nosniff</code>.</li>
            </ul>

            <h2>Managing Attachments</h2>
            <p>
              On any Asset page, toggle edit mode and look for the **Attachments** section at the bottom.
              Drag and drop files to instantly upload them, or click "Remove" on individual entries to delete attachments.
            </p>
          </>
        )}

        {/* API REFERENCE */}
        {active === 'api-reference' && (
          <>
            <h1>REST API Reference</h1>
            <p>
              Atlas exposes a comprehensive, RESTful JSON API. For interactive exploration, see the full REST API Explorer
              under the Sidebar's API Docs menu.
            </p>

            <h2>Authentication</h2>
            <ul>
              <li><strong>Session Authentication (Browser):</strong> Access cookies are automatically checked when making requests.</li>
              <li><strong>Programmatic Authentication:</strong> Pass a Bearer token in the request header generated from SCIM or system profiles:
                <CodeBlock language="text">{"Authorization: Bearer <your_token_here>"}</CodeBlock>
              </li>
            </ul>

            <h2>Response Envelope</h2>
            <p>
              All collection endpoints return a standardized, wrapped JSON envelope to support consistent pagination:
            </p>
            <CodeBlock language="json">{`{
  "data": [ ... ],
  "total": 125,
  "limit": 10,
  "offset": 0
}`}</CodeBlock>

            <h2>Query Parameters</h2>
            <p>
              All collection endpoints support pagination and sorting:
            </p>
            <ul>
              <li><code>limit</code>: Number of records to return (Default: <code>20</code>).</li>
              <li><code>offset</code>: Number of records to skip (Default: <code>0</code>).</li>
              <li><code>sort</code>: Field key to order by (e.g., <code>ci_base.name</code>).</li>
              <li><code>order</code>: Sorting order (<code>asc</code> or <code>desc</code>).</li>
            </ul>

            <h2>Filter Query Syntax</h2>
            <p>
              To query specific fields, collection GET requests accept a JSON-formatted query string parameter: <code>?filter={"<JSON>"}</code>.
              The format is an array of conditions:
            </p>
            <CodeBlock language="json">{`[
  { "field": "name", "operator": "startsWith", "value": "prod" },
  { "field": "environment", "operator": "eq", "value": "production" }
]`}</CodeBlock>

            <h3>Supported Operators</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>eq</code></td><td>Strict equality (exact match)</td></tr>
                <tr><td><code>neq</code></td><td>Inquality (does not equal)</td></tr>
                <tr><td><code>contains</code></td><td>Substring search (wildcard SQL <code>%value%</code>)</td></tr>
                <tr><td><code>startsWith</code></td><td>Prefix search (wildcard SQL <code>value%</code>)</td></tr>
                <tr><td><code>isEmpty</code></td><td>Field is null or empty string (no value needed)</td></tr>
              </tbody>
            </table>

            <h2>Standard Error Format</h2>
            <p>
              When a request fails, the API returns a structured JSON error response:
            </p>
            <CodeBlock language="json">{`{
  "error": "Conflict",
  "message": "A CI with this name already exists",
  "statusCode": 409
}`}</CodeBlock>
          </>
        )}

        {/* SEARCH & FILTER */}
        {active === 'search-filter' && (
          <>
            <h1>Search & Filter</h1>
            <p>
              Finding the right infrastructure quickly is critical. Atlas implements high-performance search
              and custom filtering capabilities.
            </p>

            <h2>Full-Text Global Search</h2>
            <p>
              The top header search bar performs indexed search across Services, Applications, and CIs:
            </p>
            <ul>
              <li>Powered by SQLite's virtual FTS5 tables with automated triggers syncing base tables.</li>
              <li>Results are instantly calculated and ranked using TF-IDF-based relevance scores.</li>
              <li>Supports debounced autocompletion as you type, and results can be filtered by entity class.</li>
            </ul>

            <h2>List Page Filters</h2>
            <p>
              Each entity collection page features an advanced filter builder in its toolbar:
            </p>
            <ul>
              <li>Click the filter icon in the toolbar to expand the builder panel.</li>
              <li>Build nested logical rules combining multiple column filters.</li>
              <li>The table columns can be shown or hidden dynamically via the column selector modal.</li>
            </ul>

            <h2>Bulk Export Limitation</h2>
            <p>
              Bulk export (such as direct CSV/Excel download from search views) is **not yet supported** within the Atlas UI.
              For exporting bulk records, please query the REST API directly using pagination to retrieve your target records in JSON format.
            </p>
          </>
        )}

        {/* DATA MODEL */}
        {active === 'data-model' && (
          <>
            <h1>Data Model</h1>
            <p>
              Atlas uses SQLite (development) or PostgreSQL (production) with 33 tables.
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
              <li><code>attachments</code> — Metadata for file attachments</li>
              <li><code>asset_attachments</code> — Relationship mapping between assets and uploaded files</li>
              <li><code>rack_placements</code> — Coordinates and placement of CIs inside rack enclosures</li>
              <li><code>integration_connectors</code> — Configured sources and sync targets for external integrations</li>
              <li><code>integration_sync_logs</code> — Execution logs and run results for connector synchronization jobs</li>
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

        {/* DATABASE & BACKUP */}
        {active === 'database' && (
          <>
            <h1>Database & Backup</h1>
            <p>
              Atlas relies on a lightweight, exceptionally fast storage tier that can scale from small on-prem instances to enterprise containers.
            </p>

            <h2>SQLite Architecture (Development)</h2>
            <p>
              In development, Atlas uses <strong>better-sqlite3</strong> configured in write-ahead logging (WAL) mode.
              To maintain absolute consistency:
            </p>
            <ul>
              <li>The connection pool size in <code>db/knexfile.js</code> is explicitly restricted: <code>{"pool: { min: 1, max: 1 }"}</code>.</li>
              <li>Increasing the connection pool size is <strong>not recommended</strong>. Due to SQLite's design, multiple simultaneous connection writes can lead to database locking or stale snapshots.</li>
            </ul>

            <h2>SQLite Backup Procedure</h2>
            <p>
              To back up a running SQLite deployment, copy the following files under the <code>data/</code> directory:
            </p>
            <ol>
              <li><code>atlas.db</code> (Primary database file)</li>
              <li><code>atlas.db-shm</code> (Shared memory index)</li>
              <li><code>atlas.db-wal</code> (Write-ahead logs)</li>
            </ol>
            <p>
              Always copy these three files **together** while the process is stopped, or run SQLite's built-in <code>VACUUM INTO</code> command via a hook to execute hot backups.
            </p>

            <h2>PostgreSQL Setup (Production)</h2>
            <p>
              For high-availability, containerized, or concurrent production deployments, Atlas supports **PostgreSQL**:
            </p>
            <ol>
              <li>Configure the connection environment variable:
                <CodeBlock language="text">{"DATABASE_URL=postgresql://user:password@host:5432/atlas_db"}</CodeBlock>
              </li>
              <li>Run the initialization command to generate the database schema:
                <CodeBlock language="bash">{"npm run db:init"}</CodeBlock>
              </li>
            </ol>

            <h2>Data Migration Path</h2>
            <p>
              There is **no automated cross-dialect migration script** to port data from SQLite to PostgreSQL.
              When switching from SQLite to PostgreSQL, the target instance must be newly seeded.
              If you have existing production data, use the REST API to export records in JSON format and import them into the PostgreSQL database.
            </p>
          </>
        )}

        {/* CHANGELOG */}
        {active === 'changelog' && (
          <>
            <h1>Changelog</h1>
            <p>
              Track features, optimizations, and bug fixes added to Atlas.
            </p>

            <h3>[0.1.0] — 2026-06-06</h3>
            <p><strong>Initial public release.</strong> Core features included:</p>
            <ul>
              <li>JWT session authentication with httpOnly cookie storage.</li>
              <li>Role-based access controls supporting admin, editor, and viewer roles.</li>
              <li>Comprehensive entity tables with polymorphic table-inheritance logic.</li>
              <li>Drag-and-drop Form Designer supporting customizable fields and per-class layouts.</li>
              <li>Fully interactive xyflow-driven Relationship Graphs.</li>
              <li>Leaflet-powered Location Maps with OpenStreetMap integrations.</li>
              <li>Automatic audit trail logging and team-based notification delivery.</li>
              <li>Advanced datacentre Rack layout editor with side-by-side front/back columns, hover tooltips, and a standalone full-screen layout.</li>
            </ul>
          </>
        )}
      </div>

      {/* SEARCH COMMAND PALETTE MODAL OVERLAY */}
      {paletteOpen && (
        <div className={styles.paletteOverlay} onClick={() => setPaletteOpen(false)}>
          <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
            <div className={styles.paletteHeader}>
              <Search size={16} className={styles.paletteIcon} />
              <input
                type="text"
                className={styles.paletteInput}
                placeholder="Search documentation (Cmd/Ctrl+K)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <span className={styles.paletteShortcutBadge}>ESC</span>
            </div>
            
            {query.trim().length >= 2 && (
              <div className={styles.paletteResults}>
                {results.length > 0 ? (
                  results.map((r, i) => (
                    <div
                      key={r.id}
                      className={`${styles.paletteResult}${paletteIndex === i ? ' ' + styles.paletteResultActive : ''}`}
                      onClick={() => {
                        setActive(r.id);
                        setPaletteOpen(false);
                      }}
                    >
                      <div className={styles.paletteLabel}>{r.label}</div>
                      <div className={styles.paletteExcerpt}>
                        {r.excerptParts.map((part, pi) => {
                          const isMatch = query.toLowerCase().trim().split(/\s+/).some(w => part.toLowerCase() === w);
                          return isMatch ? <mark key={pi}>{part}</mark> : part;
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.paletteEmpty}>No results for "{query}"</div>
                )}
              </div>
            )}
            
            {query.trim().length < 2 && (
              <div className={styles.paletteEmpty}>Type at least 2 characters to search...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
