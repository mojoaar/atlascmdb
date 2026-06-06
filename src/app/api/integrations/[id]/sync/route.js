import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/rbac';
import { handleApiError, success, notFound, badRequest, guardResponse } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';
import { getConnector } from '../../../../../lib/connectors';

export async function POST(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { id } = await params;
    const connector = await db('integration_connectors').where({ id }).first();

    if (!connector) return notFound('Integration connector');
    if (!connector.enabled) return badRequest('Connector is disabled');

    const mod = getConnector(connector.connectorType);
    if (!mod) return badRequest(`No handler for connector type: ${connector.connectorType}`);

    const logId = uuidv4();
    const startedAt = new Date().toISOString();

    await db('integration_sync_logs').insert({
      id: logId,
      connectorId: id,
      triggeredBy: auth.user.id,
      startedAt,
      status: 'running',
    });

    let stats;
    try {
      stats = await mod.sync(connector, db);

      const completedAt = new Date().toISOString();
      await db('integration_sync_logs').where({ id: logId }).update({
        completedAt,
        status: stats.errors.length === 0 ? 'success' : 'error',
        recordsCreated: stats.created || 0,
        recordsUpdated: stats.updated || 0,
        recordsSkipped: stats.skipped || 0,
        recordsErrored: stats.errored || 0,
        errorMessage: stats.errors.length > 0 ? stats.errors.map(e => e.error).join('; ') : null,
        detail: JSON.stringify(stats.errors),
      });

      const summary = `Created ${stats.created}, Updated ${stats.updated}, Skipped ${stats.skipped}, Errored ${stats.errored}`;
      await db('integration_connectors').where({ id }).update({
        lastSyncAt: completedAt,
        lastSyncStatus: stats.errors.length === 0 ? 'success' : 'error',
        lastSyncSummary: summary,
        updatedAt: completedAt,
      });

      await logAudit({
        actorUserId: auth.user.id,
        entityType: 'integration',
        entityId: id,
        action: 'updated',
        beforeData: { lastSyncAt: connector.lastSyncAt, lastSyncStatus: connector.lastSyncStatus },
        afterData: { lastSyncAt: completedAt, lastSyncStatus: stats.errors.length === 0 ? 'success' : 'error', summary },
      });

      return success({
        logId,
        status: stats.errors.length === 0 ? 'success' : 'error',
        created: stats.created || 0,
        updated: stats.updated || 0,
        skipped: stats.skipped || 0,
        errored: stats.errored || 0,
        errors: stats.errors,
      });
    } catch (err) {
      const completedAt = new Date().toISOString();
      await db('integration_sync_logs').where({ id: logId }).update({
        completedAt,
        status: 'error',
        errorMessage: err.message,
        detail: JSON.stringify([{ error: err.message }]),
      });

      await db('integration_connectors').where({ id }).update({
        lastSyncAt: completedAt,
        lastSyncStatus: 'error',
        lastSyncSummary: `Error: ${err.message}`,
        updatedAt: completedAt,
      });

      return success({
        logId,
        status: 'error',
        created: 0,
        updated: 0,
        skipped: 0,
        errored: 0,
        errors: [{ error: err.message }],
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
