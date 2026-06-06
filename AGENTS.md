# Atlas CMDB — Agent Instructions

## Quick Commands

```sh
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build — run this to verify changes compile
npm run test          # Run all tests (vitest run — uses separate test.db)
npm run test:watch    # Interactive test runner
npm run db:init       # Blank install: migrate + admin user only (no demo data)
npm run db:setup      # Full demo install: migrate + all seeds (destroys all data)
npm run lint          # Run linter
```

Always run `npm run build` after making changes across multiple files.

## Releases & Git Tags

Never create git tags or GitHub releases autonomously. The maintainer decides when to cut releases and assigns version numbers and tag names. Commit and push work when asked, but do not tag.

## Architecture

Next.js 16.2.7 App Router with better-sqlite3 (dev) and PostgreSQL (production via Knex).
Path alias `@/` → `./src/`.

### Key Libraries
- **Auth**: JWT via jsonwebtoken, passhash via bcryptjs, TOTP MFA via otpauth (`import * as OTPAuth from 'otpauth'`)
- **DB**: Knex with better-sqlite3 (WAL mode, foreign_keys ON)
- **Graphs**: @xyflow/react v12 + @dagrejs/dagre layout (requires custom nodes with `<Handle>`)
- **Maps**: react-leaflet v5 / leaflet
- **Charts**: recharts v3
- **SSO**: openid-client v6 (OIDC PKCE S256)
- **CSS**: CSS Modules with custom properties (light/dark via `data-theme` attribute)

### Directory Layout

```
src/
  app/
    layout.js             # Root layout (server component — no AuthProvider here)
    page.js               # Redirect to /login
    admin/                # Admin pages + ADMIN layout
    portal/               # Portal pages + PORTAL layout
    api/                  # 100+ API route handlers
    apidocs/              # REST API Explorer (separate page from docs)
  lib/
    db.js                 # Knex singleton (TEST_DB=true → test.db)
    auth.js               # JWT, password, MFA, cookie helpers, extractUserFromRequest
    rbac.js               # requireAuth(), requireAdmin(), requireEditor() closures
    api-helpers.js        # success(), created(), notFound(), badRequest(), handleApiError()
    audit.js              # logAudit() + auto-notification triggers
    scim.js               # SCIM token verification
    form-fields.js        # ENTITY_FIELDS registry + DEFAULT_LAYOUTS per entity type
  components/
    auth/AuthProvider.js  # React context: user, loading, logout, refresh, formatDateTime/formatDate
    layout/Shell.js       # Sidebar + header with theme toggle, nav + user section
    graph/                # GraphViewer, InlineGraph, MapViewer
    ui/                   # 21 reusable components (see src/components/ui/)
```

### Route Structure

- Portal: `/portal` — layout fetches `/api/auth/me`, wraps in `AuthProvider seededUser={user}`
- Admin: `/admin` — same pattern, independent layout
- Login: public (`/login`, `/forgot-password`, `/reset-password`)
- API docs: `/apidocs` (opens in new tab from sidebar)

## Database (better-sqlite3)

### Connection Pool — CRITICAL

`db/knexfile.js` sets `pool: { min: 1, max: 1 }` in development. This is **intentional** — multiple WAL connections would read stale snapshots. Do NOT increase the pool size without understanding this.

The DB file lives at `data/atlas.db`. Use `process.cwd()` (not `__dirname`) to construct paths — `__dirname` is module-resolved to a different directory.

### Migrations & Seeds

28 migrations (001–028). All have `up` and `down` methods. Run sequentially:
```sh
node db/setup.js   # Runs knex migrate:latest then knex seed:run
```

## API Route Patterns

### File Depth Matters

API routes use relative imports from `../../lib/` with varying depth. Deeply nested routes like `api/entities/[type]/[id]/graph/` use `../../../../../../lib/`. Count the directory levels and verify manually.

### Next.js 16: Async Params

`params` is a Promise in Next.js 16 route handlers. Always destructure with `await`:
```js
const { id } = await params;     // correct
params.id                        // BROKEN — returns undefined
```

### Auth Guards Must Be Called

`requireAuth()`, `requireAdmin()`, etc. return **closures** (not direct middleware). Always call them:
```js
const auth = await requireAuth()(request);   // correct
const auth = requireAuth(request);            // BROKEN — returns function, not result
```

Auth guards should be inside the `try` block, not before it.

### Standard Response Helpers

Always use helpers from `src/lib/api-helpers.js`:
```js
return success(data);              // 200
return created(data);              // 201
return notFound('Service');        // 404
return badRequest('Missing name'); // 400
```

Never call `NextResponse.json()` directly in route handlers — use helpers.

### Paginated List Pattern

List endpoints return `{ data: [...], total: N, limit: N, offset: N }`:
```js
const [countResult] = await query.clone().count('* as total');
const rows = await query.orderBy(sortCol, order).limit(limit).offset(offset);
return success({ data: rows, total: countResult.total, limit, offset });
```

### Filter Support

Routes with filter support define:
- `ALLOWED_FIELDS`: Set of filterable column names
- `FIELD_COL`: Map of frontend field names → qualified DB column names (for joined tables)
- `VALID_OPS`: Set of allowed operators (eq, neq, contains, startsWith, isEmpty)
- Parse `?filter=<JSON>` query param into a conditions array

### Audit Logging

All entity write operations (POST/PATCH/DELETE) must call `logAudit()`:
```js
await logAudit({
  actorUserId: auth.user.id,
  entityType: 'service',
  entityId: baseId,
  action: 'created',     // or 'updated', 'deleted'
  beforeData: null,      // existing record for PATCH/DELETE
  afterData: record,     // new record for POST/PATCH, null for DELETE
});
```

### Cookie Handling (Next.js 16)

`cookies()` from `next/headers` must be awaited:
```js
const cookieStore = await cookies();
const token = cookieStore.get('atlas_access')?.value;
```

## Entity Architecture

### Table Inheritance Pattern

Services, applications, and CIs use base-table + child-table inheritance:
- `service_base` + `business_services` / `technical_services` (type='business'|'technical')
- `application_base` + `applications`
- `ci_base` + `cis`

When querying: `db('service_base').leftJoin('business_services', ...).leftJoin('technical_services', ...)`

### Entity Type Mapping

Supported entity types: service, application, ci, asset, team, location, user, role, theme, relationship.

In graph/relationship APIs: filter to `.whereIn('sourceType', VALID_TYPES)` where VALID_TYPES = ['service', 'application', 'ci']. Team and location nodes are excluded from the graph.

### Dynamic Route Parameters

Entity detail pages use `[id]` dynamic segments. `id === 'new'` means create mode. All detail pages have view/edit toggle (`viewMode` state, defaults to `true` when `id !== 'new'`).

## Frontend Auth

`AuthProvider` wraps admin and portal layouts (via `seededUser` prop to avoid double-fetching). Child pages access context via:
- `useAuth()` — returns `{ user, loading, logout, refresh }`
- `useFormat()` — returns `{ formatDateTime, formatDate, refresh }` (null-safe, has fallback defaults)

Settings pages call `refresh()` after saving to sync formatting preferences across the app.

## CSS

CSS Modules only. Design tokens in `src/styles/globals.css` as custom properties. Dark mode via `[data-theme="dark"]` on `<html>`.

Shared entity page styles at `src/styles/entity.module.css`, imported as `@/styles/entity.module.css`. Both admin and portal pages share this single file.

Key classes: `.fieldGrid` (auto-fill grid for form fields), `.toolbar` (flex row for search/filter/actions), `.section`/.`sectionTitle` (grouped form sections).

## Graph (@xyflow/react v12)

### Required Handle Components

Custom nodes MUST include `<Handle>` components with matching IDs on edges:
```jsx
<Handle type="source" position={Position.Bottom} id="s" />
<Handle type="target" position={Position.Top} id="t" />
```
Edges must reference these: `{ sourceHandle: 's', targetHandle: 't' }`. Without them, edges won't render (xyflow error #008).

### Depth Control

Graph API (`/api/entities/[type]/[id]/graph`) supports `?depth=1-6` (default 3). Uses BFS from center node. InlineGraph component is hardcoded to depth=2.

## Form Designer

Admin detail pages (services, applications, CIs, assets) use dynamic form layouts stored as JSON in the `app_config` table via `/api/config`:

- Config keys: `form_layout_service`, `form_layout_application`, `form_layout_ci`, `form_layout_asset`, `form_layout_rack`
- Per-class CI keys: `form_layout_ci:server`, `form_layout_ci:network_device`, `form_layout_ci:storage`, `form_layout_ci:database`, `form_layout_ci:container`, `form_layout_ci:rack`, `form_layout_ci:other`
- Each CI class can have its own saved layout; `form_layout_ci` is the generic fallback
- Fall back to `DEFAULT_LAYOUTS[entityType]` from `src/lib/form-fields.js` if no config key exists
- Layout has `sections` (field groupings) + `componentSections` (Relationships, Audit Trail, Attachments)
- Per-section `columns` (1-3) controls grid via `.gridCols1`/`.gridCols2`/`.gridCols3` CSS classes
- Each page follows the same integration pattern: `formLayout` state → `getEffectiveLayout()` → `renderLayout()` + `renderComponentSections()`
- Field rendering delegates to `FormFieldRenderer` component (handles text, select, date, number, textarea)
- Form Designer button is in `DetailMenu` `extraItems` prop (hamburger menu, admin-only)

When adding a new entity to the Form Designer:
1. Add field registry + default layout to `src/lib/form-fields.js`
2. In the detail page: import `FormDesigner`, `FormFieldRenderer`, `getEntityFields`, `getDefaultLayout`
3. Add `formLayout` state + config fetch `useEffect` with the right config key
4. Replace hardcoded form JSX with `renderLayout()` + `renderComponentSections()`
5. Add `<FormDesigner>` modal + `handleLayoutSave()` that `PUT`s to `/api/config`
6. Pass `referenceData={{ teams, locations, cis, users }}` to `FormFieldRenderer` for optionsRef fields

## Theme Architecture

Themes use dual-mode palettes: `tokenSetLight` and `tokenSetDark` on a single theme row.
Migration 025 removed the old `mode` column. All 8 themes (Blue Line, 4 Catppuccin variants, Nord, Dracula, Cyberpunk) are `isSystem:true`. Shell.js `ThemeToggle` and portal settings apply theme tokens dynamically to `:root` / `[data-theme="dark"]`.

## Testing

Tests use vitest with a separate `data/test.db` database. Set `TEST_DB='true'` env var (already in vitest.config.js).

Test DB is created fresh per suite (migrated in beforeAll, destroyed in afterAll). Use `singleFork: true` to avoid SQLite parallelism issues.

`tests/setup.js` exports `seedTestData()` helper that creates test users/roles/teams.

Test auth helpers use `requireAuth()()(request)` — double parentheses (closure invocation + request passing).

## Known Gotchas

1. **WAL multi-connection staleness**: Single-connection pool is critical for dev. If you see stale reads after writes, this is why.
2. **Auth guards are closures**: Always `requireAuth()(request)`, never `requireAuth(request)`.
3. **Params are Promises**: Next.js 16 — always `const { id } = await params`.
4. **Import depth varies by route nesting**: Count `../` levels manually for deep routes.
5. **`@xyflow/react` edges need Handle IDs**: Custom nodes require `<Handle>` with matching source/target IDs.
6. **`success()` wraps in `{ data }`**: Frontend destructures `result.data || result`.
7. **EntityList `detailPath`**: Must pass page path (e.g. `/admin/services`), not API path (`/api/services`).
8. **Knex `.clone().count()`**: Apply BEFORE `.orderBy()` and `.limit()` to get total rows.
 9. **CSS class `fieldGrid` only**: `entity.module.css` defines `.fieldGrid` but not `.formGrid`. Also use `.gridCols1`/`.gridCols2`/`.gridCols3` to override grid-template-columns per section.
 10. **service_base has `lifecycleStatus`, not `status`**: The column is named `lifecycleStatus`.
 11. **Empty strings fail FK constraints**: Select components emit `""` when no option is selected. PATCH handlers must convert `""` to `null` for nullable FK columns (ownerTeamId, locationId, ciId, assignedTo).
 12. **Drag-and-drop in FormDesigner uses refs, not state**: React state updates from `onDragStart` are async and won't be visible in `onDrop`. Always use `useRef` for drag tracking across event handlers in the same cycle.
 13. **Impersonation `isSelf` vs `targetUserId`**: Under user impersonation, `extractUserFromRequest` sets the actor's ID to `auth.user.id` and the impersonated user's ID to `auth.user.targetUserId`. When updating self-attributes (like avatar color or background) on behalf of the impersonated user, the endpoint permission check must allow updates when either condition is met: `const isSelf = auth.user.id === id || auth.user.targetUserId === id`.
 14. **Vitest concurrency/pool configuration**: To avoid SQLite locking and synchronization issues on the shared `test.db`, keep sequential execution enabled in `vitest.config.js` via `fileParallelism: false`.
 15. **Bcrypt Hash compatibility**: The database seed uses different salt versions (`$2a$` or `$2b$`) depending on the execution environment. Assertions in tests must be flexible (e.g., verifying `startsWith('$2a$') || startsWith('$2b$')`).
 16. **`/api/config` ALLOWED_KEYS allowlist**: Any new `app_config` key written via `PUT /api/config` must be added to the `ALLOWED_KEYS` set in `src/app/api/config/route.js` or the request returns a 400. Current keys include `form_layout_*` (incl. per-Class `form_layout_ci:{ciType}`), `column_default_*` (per-entity), SSO, SCIM, `row_limit_default`, and `attachment_allowed_types`.
 17. **`serverExternalPackages` in `next.config.js`**: Only native-binding packages need listing (`better-sqlite3`, `knex`, `bcryptjs`). Do not add pure-JS packages here.