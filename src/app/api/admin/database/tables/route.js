import getDb from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/rbac';
import { handleApiError, success, guardResponse } from '../../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    let tables = [];

    if (db.client.config.client === 'sqlite3' || db.client.config.client === 'better-sqlite3') {
      const rows = await db.raw(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%' ORDER BY name"
      );
      tables = rows.map((r) => r.name);
    } else {
      // PostgreSQL fallback
      const rows = await db.raw(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name NOT LIKE 'knex_%' ORDER BY table_name"
      );
      tables = rows.rows.map((r) => r.table_name);
    }

    return success({ tables });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch database tables');
  }
}
