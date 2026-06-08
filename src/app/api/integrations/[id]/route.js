import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/rbac';
import { handleApiError, success, notFound, badRequest, guardResponse } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

const SECRET_KEYS = new Set(['apiKey']);
const VALID_CONFLICT_MODES = ['overwrite', 'merge', 'skip'];

const maskConnector = (c) => ({
  ...c,
  apiKey: c.apiKey ? c.apiKey.slice(0, 8) + '••••••••••••' : null,
  enabled: !!c.enabled,
});

export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { id } = await params;
    const connector = await db('integration_connectors').where({ id }).first();

    if (!connector) return notFound('Integration connector');

    return success(maskConnector(connector));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { id } = await params;
    const existing = await db('integration_connectors').where({ id }).first();

    if (!existing) return notFound('Integration connector');

    const body = await request.json();
    const updates = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.baseUrl !== undefined) updates.baseUrl = body.baseUrl || null;
    if (body.apiKey !== undefined) updates.apiKey = body.apiKey || null;
    if (body.enabled !== undefined) updates.enabled = !!body.enabled;
    if (body.config !== undefined) {
      updates.config = typeof body.config === 'string' ? body.config : JSON.stringify(body.config);
    }
    if (body.conflictMode !== undefined) {
      if (!VALID_CONFLICT_MODES.includes(body.conflictMode)) {
        return badRequest(`Invalid conflictMode: ${body.conflictMode}`);
      }
      updates.conflictMode = body.conflictMode;
    }
    if (body.fieldOverrides !== undefined) {
      updates.fieldOverrides = typeof body.fieldOverrides === 'string'
        ? body.fieldOverrides
        : JSON.stringify(body.fieldOverrides);
    }

    if (Object.keys(updates).length === 0) {
      return badRequest('No valid fields to update');
    }

    updates.updatedAt = new Date().toISOString();

    await db('integration_connectors').where({ id }).update(updates);

    const after = await db('integration_connectors').where({ id }).first();

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'integration',
      entityId: id,
      action: 'updated',
      beforeData: { ...existing, apiKey: existing.apiKey ? '••••••••' : null },
      afterData: { ...after, apiKey: after.apiKey ? '••••••••' : null },
    });

    return success(maskConnector(after));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { id } = await params;
    const existing = await db('integration_connectors').where({ id }).first();

    if (!existing) return notFound('Integration connector');

    await db('integration_sync_logs').where({ connectorId: id }).del();
    await db('integration_connectors').where({ id }).del();

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'integration',
      entityId: id,
      action: 'deleted',
      beforeData: { ...existing, apiKey: existing.apiKey ? '••••••••' : null },
      afterData: null,
    });

    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
