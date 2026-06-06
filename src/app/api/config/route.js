import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAdmin } from '../../../lib/rbac';
import { handleApiError, success, badRequest } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

// Only these keys may be written through the config API. Anything else is rejected
// so a crafted PUT cannot inject arbitrary rows into app_config.
const ALLOWED_KEYS = new Set([
  'sso_enabled',
  'oidc_issuer_url',
  'oidc_client_id',
  'oidc_client_secret',
  'scim_enabled',
  'scim_bearer_token',
  'attachment_allowed_types',
  'row_limit_default',
  'form_layout_service',
  'form_layout_application',
  'form_layout_ci',
  'form_layout_asset',
  'column_default_services',
  'column_default_applications',
  'column_default_cis',
  'column_default_assets',
  'column_default_teams',
  'column_default_users',
  'column_default_locations',
  'column_default_roles',
  'column_default_themes',
]);

// Values for these keys must never be written to the audit log in plaintext.
const SECRET_KEYS = new Set(['oidc_client_secret', 'scim_bearer_token']);

const redact = (key, value) => (SECRET_KEYS.has(key) && value ? '••••••••' : value);

export async function GET(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const rows = await db('app_config').select('key', 'value');
    const config = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    config.scim_bearer_token_masked = config.scim_bearer_token
      ? config.scim_bearer_token.slice(0, 8) + '••••••••••••'
      : '';
    config.oidc_client_secret_masked = config.oidc_client_secret
      ? config.oidc_client_secret.slice(0, 8) + '••••••••••••'
      : '';
    delete config.oidc_client_secret;
    delete config.scim_bearer_token;

    return success(config);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const body = await request.json();
    const db = getDb();

    const entries = Object.entries(body).filter(([, value]) => typeof value === 'string');
    const invalid = entries.filter(([key]) => !ALLOWED_KEYS.has(key)).map(([key]) => key);
    if (invalid.length) {
      return badRequest(`Unknown config key(s): ${invalid.join(', ')}`);
    }

    for (const [key, value] of entries) {
      const existing = await db('app_config').where({ key }).first();
      await db('app_config').insert({ key, value }).onConflict('key').merge({ value });

      await logAudit({
        actorUserId: auth.user.id,
        entityType: 'config',
        entityId: key,
        action: existing ? 'updated' : 'created',
        beforeData: existing ? { key, value: redact(key, existing.value) } : null,
        afterData: { key, value: redact(key, value) },
      });
    }

    return success({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
