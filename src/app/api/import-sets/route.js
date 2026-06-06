import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAuth, requireEditor } from '../../../lib/rbac';
import { handleApiError, success, created, guardResponse, badRequest } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);
    const db = getDb();
    const sets = await db('import_sets')
      .leftJoin('users', 'import_sets.createdBy', 'users.id')
      .select('import_sets.*', 'users.displayName as createdByName')
      .orderBy('import_sets.createdAt', 'desc');

    return success(sets);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { name, sourceType, sourceName } = await request.json();
    if (!name) return badRequest('name required');

    const id = uuidv4();
    await db('import_sets').insert({
      id, name, sourceType, sourceName, status: 'pending', createdBy: auth.user.id,
    });

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'import',
      entityId: id,
      action: 'created',
      afterData: { name, sourceType, sourceName },
    });

    return created({ id, name, status: 'pending' });
  } catch (error) {
    return handleApiError(error);
  }
}
