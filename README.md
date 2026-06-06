# Atlas CMDB

Open-source CMDB for IT teams — services, applications, CIs, assets, and relationships in one place.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

---

## Features

- **Entity management** — services (business & technical), applications, configuration items (CIs), assets, teams, locations, and users
- **Relationship graph** — interactive dependency graphs with BFS depth control (1–6 hops) and Dagre auto-layout
- **Geographic maps** — location-aware asset/CI mapping via Leaflet + OpenStreetMap
- **Import / Export** — CSV import with field mapping, preview, and conflict resolution; CSV/JSON export per entity type
- **SSO / SCIM** — OpenID Connect (PKCE S256) single sign-on and SCIM 2.0 provisioning, configured via admin UI
- **MFA** — TOTP two-factor authentication (RFC 6238) with QR code setup
- **Audit trail** — full change history with before/after diffs and actor attribution
- **Themes** — 8 built-in colour themes (Blue Line, Catppuccin × 4, Nord, Dracula, Cyberpunk) with light/dark toggle

---

## Quick Start

```sh
git clone git@github.com:mojoaar/atlascmdb.git
cd atlascmdb
npm install

# Blank install — migrations + admin user only (no demo data)
npm run db:init

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:

| Field    | Value                  |
|----------|------------------------|
| Email    | `alice@atlas.local`    |
| Password | `password123`          |

> **Full demo data** — run `npm run db:setup` instead of `db:init` to populate services, applications, CIs, assets, teams, locations, and relationships.

---

## Tech Stack

| Library | Purpose |
|---|---|
| [Next.js](https://nextjs.org) | Framework (App Router) |
| [React](https://react.dev) | UI |
| [Knex.js](https://knexjs.org) | Query builder / migrations |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite (development) |
| [@xyflow/react](https://reactflow.dev) | Relationship graph canvas |
| [@dagrejs/dagre](https://github.com/dagrejs/dagre) | Graph auto-layout |
| [recharts](https://recharts.org) | Dashboard charts |
| [react-leaflet](https://react-leaflet.js.org) / [Leaflet](https://leafletjs.com) | Geographic maps |
| [openid-client](https://github.com/panva/openid-client) | SSO (OIDC PKCE S256) |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT auth |
| [otpauth](https://github.com/hectorm/otpauth) | TOTP MFA |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| [lucide-react](https://lucide.dev) | Icons |
| [uuid](https://github.com/uuidjs/uuid) | ID generation |

---

## Configuration

Copy the variables below into a `.env.local` file at the project root.

### Authentication (required in production)

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | insecure dev fallback | Secret key for signing JWT access tokens. **Must be set in production** — the app warns and exits if absent. |
| `JWT_REFRESH_SECRET` | insecure dev fallback | Secret key for signing JWT refresh tokens. Same production enforcement. |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime. Any [`ms`](https://github.com/vercel/ms)-compatible string (e.g. `30m`, `2h`). |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime. |
| `MFA_ISSUER` | `Atlas` | Issuer name displayed in TOTP authenticator apps (e.g. Google Authenticator). |

### Database

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string for production (e.g. `postgres://user:pass@host:5432/atlas`). In development, SQLite is used automatically at `data/atlas.db`. |

### Runtime

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Set to `production` in production deployments. Enables secure cookies and enforces secret validation. |

### SSO / SCIM

OpenID Connect (SSO) and SCIM 2.0 provisioning are configured through the **Admin → Settings** UI and stored in the database. No environment variables are required for these features.

---

## Contributing

Contributions are welcome. Fork the repository, create a branch, make your changes, and open a pull request against `main`.

Repository: [git@github.com:mojoaar/atlascmdb.git](https://github.com/mojoaar/atlascmdb)

---

## Credits

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Knex.js](https://knexjs.org)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [@xyflow/react](https://reactflow.dev)
- [@dagrejs/dagre](https://github.com/dagrejs/dagre)
- [recharts](https://recharts.org)
- [react-leaflet](https://react-leaflet.js.org)
- [Leaflet](https://leafletjs.com)
- [OpenStreetMap](https://www.openstreetmap.org/about)
- [lucide-react](https://lucide.dev)
- [openid-client](https://github.com/panva/openid-client)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [otpauth](https://github.com/hectorm/otpauth)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- [uuid](https://github.com/uuidjs/uuid)
- [Catppuccin](https://catppuccin.com)
- [Nord](https://www.nordtheme.com)
- [Dracula](https://draculatheme.com)
- [Cyberpunk](https://www.media.io/color-palette/cyberpunk-color-palette.html)

---

## Changelog

### [0.1.0] — 2026-06-06

Initial public release.

---

## License

Copyright (C) 2026 Atlas Contributors

This program is free software: you can redistribute it and/or modify it under the terms of the [GNU Affero General Public License](LICENSE) as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
