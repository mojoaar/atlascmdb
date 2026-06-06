import getDb from '../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

async function getFullApp(id) {
  const db = getDb();
  const row = await db('application_base')
    .leftJoin('teams', 'application_base.ownerTeamId', 'teams.id')
    .leftJoin('applications', 'application_base.id', 'applications.applicationBaseId')
    .select(
      'application_base.*',
      'teams.name as ownerTeamName',
      'applications.id as childId', 'applications.appType', 'applications.technologyStack'
    )
    .where('application_base.id', id)
    .first();

  if (!row) return null;

  return {
    id: row.id, name: row.name, description: row.description,
    ownerTeamId: row.ownerTeamId, ownerTeamName: row.ownerTeamName,
    lifecycleStatus: row.lifecycleStatus, environment: row.environment,
    vendor: row.vendor, version: row.version, classification: row.classification,
    createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt,
    createdBy: row.createdBy, updatedBy: row.updatedBy,
    appType: row.appType, technologyStack: row.technologyStack,
  };
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const app = await getFullApp((await params).id);
    if (!app) return notFound('Application');
    return success(app);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const existing = await db('application_base').where({ id: (await params).id }).first();
    if (!existing) return notFound('Application');

    const body = await request.json();
    const baseUpdates = {};
    const fields = ['name', 'description', 'ownerTeamId', 'lifecycleStatus', 'environment', 'vendor', 'version', 'classification'];
    fields.forEach(f => { if (body[f] !== undefined) baseUpdates[f] = body[f]; });
    if (baseUpdates.ownerTeamId === '') baseUpdates.ownerTeamId = null;

    if (Object.keys(baseUpdates).length) {
      baseUpdates.updatedAt = new Date().toISOString();
      await db('application_base').where({ id: (await params).id }).update(baseUpdates);
    }

    const appUpdates = {};
    if (body.appType) appUpdates.appType = body.appType;
    if (body.technologyStack) appUpdates.technologyStack = body.technologyStack;
    if (Object.keys(appUpdates).length) {
      await db('applications').where({ applicationBaseId: (await params).id }).update(appUpdates);
    }

    if (Object.keys(baseUpdates).length > 0 || Object.keys(appUpdates).length > 0) {
      await db('application_base').where({ id: (await params).id }).update({ updatedAt: new Date().toISOString(), updatedBy: auth.user.id });
    }

    await logAudit({
      actorUserId: auth.user.id, entityType: 'application', entityId: (await params).id,
      action: 'updated', beforeData: existing, afterData: baseUpdates,
    });

    const updated = await getFullApp((await params).id);
    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    const app = await db('application_base').where({ id }).first();
    if (!app) return notFound('Application');

    await db.transaction(async (trx) => {
      await trx('application_base').where({ id }).del();
      await trx('relationships').where(function() {
        this.where({ sourceType: 'application', sourceId: id })
            .orWhere({ targetType: 'application', targetId: id });
      }).del();
      await trx('entity_tags').where({ entityType: 'application', entityId: id }).del();
      await trx('notifications').where({ entityType: 'application', entityId: id }).del();
    });

    await logAudit({
      actorUserId: auth.user.id, entityType: 'application', entityId: id,
      action: 'deleted', beforeData: app,
    });

    return success({ message: 'Application deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
