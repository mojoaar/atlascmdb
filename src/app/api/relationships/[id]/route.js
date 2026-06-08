import getDb from '../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const rel = await db('relationships').where({ id: (await params).id }).first();
    if (!rel) return notFound('Relationship');
    return success(rel);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const rel = await db('relationships').where({ id: (await params).id }).first();
    if (!rel) return notFound('Relationship');

    const body = await request.json();
    const updates = {};
    const fields = ['relationshipType', 'direction', 'notes'];
    fields.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });

    if (Object.keys(updates).length) {
      updates.updatedAt = new Date().toISOString();
      updates.updatedBy = auth.user.id;
      await db('relationships').where({ id: (await params).id }).update(updates);
      await logAudit({
        actorUserId: auth.user.id, entityType: 'relationship', entityId: (await params).id,
        action: 'updated', beforeData: rel, afterData: { ...rel, ...updates, ...(updates.updatedBy && { updatedBy: auth.user.displayName || auth.user.email }) },
      });
    }

    return success({ ...rel, ...updates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const rel = await db('relationships').where({ id: (await params).id }).first();
    if (!rel) return notFound('Relationship');

    await db('relationships').where({ id: (await params).id }).del();
    await logAudit({
      actorUserId: auth.user.id, entityType: 'relationship', entityId: (await params).id,
      action: 'deleted', beforeData: rel,
    });
    return success({ message: 'Relationship deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
