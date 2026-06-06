import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAdmin } from '../../../lib/rbac';
import { handleApiError, success, badRequest } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

// Maps the entity type to its base table. Child tables (business_services,
// technical_services, applications, cis) cascade-delete from their *_base via
// ON DELETE CASCADE, so deleting the base row is sufficient — no manual cleanup.
const TABLE_MAP = {
  services: { base: 'service_base' },
  applications: { base: 'application_base' },
  cis: { base: 'ci_base' },
  assets: { base: 'assets' },
  teams: { base: 'teams' },
  locations: { base: 'locations' },
  relationships: { base: 'relationships' },
  users: { base: 'users' },
  roles: { base: 'roles' },
  themes: { base: 'themes' },
};

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { entityType, action, ids } = await request.json();

    if (!entityType || !action || !ids?.length) {
      return badRequest('entityType, action, and ids are required');
    }

    const config = TABLE_MAP[entityType];
    if (!config) return badRequest(`Unknown entity type: ${entityType}`);

    const db = getDb();

    if (action === 'delete') {
      const beforeRecords = await db(config.base).whereIn('id', ids);

      const deleted = await db(config.base).whereIn('id', ids).del();

      for (const record of beforeRecords) {
        await logAudit({
          actorUserId: auth.user.id,
          entityType: entityType.replace(/s$/, ''),
          entityId: record.id,
          action: 'deleted',
          beforeData: record,
        });
      }

      return success({ deleted });
    }

    return badRequest(`Unknown action: ${action}`);
  } catch (error) {
    return handleApiError(error);
  }
}
