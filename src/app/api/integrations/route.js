import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAdmin } from '../../../lib/rbac';
import { handleApiError, success, created, badRequest, guardResponse } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';
import { listConnectors } from '../../../lib/connectors';

const SECRET_KEYS = new Set(['apiKey']);

const maskConnector = (c) => ({
  ...c,
  apiKey: c.apiKey ? c.apiKey.slice(0, 8) + '••••••••••••' : null,
  enabled: !!c.enabled,
});

export async function GET(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const connectors = await db('integration_connectors')
      .orderBy('createdAt', 'desc');

    return success(connectors.map(maskConnector));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const body = await request.json();
    const { name, connectorType, baseUrl, apiKey, conflictMode } = body;

    if (!name || !connectorType) {
      return badRequest('Name and connectorType are required');
    }

    const mod = listConnectors().find((m) => m.type === connectorType);
    if (!mod) {
      return badRequest(`Unknown connector type: ${connectorType}`);
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const record = {
      id,
      name,
      connectorType,
      baseUrl: baseUrl || null,
      apiKey: apiKey || null,
      conflictMode: conflictMode && ['overwrite', 'merge', 'skip'].includes(conflictMode) ? conflictMode : 'merge',
      enabled: false,
      createdBy: auth.user.id,
      createdAt: now,
      updatedAt: now,
      config: JSON.stringify(body.config || {}),
      fieldOverrides: body.fieldOverrides ? JSON.stringify(body.fieldOverrides) : null,
    };

    await db('integration_connectors').insert(record);

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'integration',
      entityId: id,
      action: 'created',
      beforeData: null,
      afterData: { ...record, apiKey: record.apiKey ? '••••••••' : null },
    });

    return created(maskConnector(record));
  } catch (error) {
    return handleApiError(error);
  }
}
