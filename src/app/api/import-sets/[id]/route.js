import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    const set = await db('import_sets')
      .leftJoin('users', 'import_sets.createdBy', 'users.id')
      .select('import_sets.*', 'users.displayName as createdByName')
      .where('import_sets.id', id)
      .first();

    if (!set) return notFound('Import Set');

    const rows = await db('import_set_rows').where({ importSetId: id }).orderBy('rowNumber');
    const mappings = await db('import_mappings').where({ importSetId: id }).orderBy('orderIndex');

    return success({ ...set, rows, mappings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    
    const existing = await db('import_sets').where({ id }).first();
    if (!existing) return notFound('Import Set');

    const { name, status } = await request.json();
    const updates = {
      ...(name ? { name } : {}),
      ...(status ? { status } : {}),
      updatedAt: new Date().toISOString(),
    };

    await db('import_sets').where({ id }).update(updates);

    const updated = await db('import_sets').where({ id }).first();

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'import',
      entityId: id,
      action: 'updated',
      beforeData: existing,
      afterData: updated,
    });

    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    const importSet = await db('import_sets').where({ id }).first();
    if (!importSet) return notFound('Import Set');

    const { rows, mappings } = await request.json();

    if (rows?.length) {
      await db('import_set_rows').where({ importSetId: id }).del();
      const rowData = rows.map((row, i) => ({
        id: uuidv4(),
        importSetId: id,
        rowNumber: i + 1,
        sourceData: typeof row === 'string' ? row : JSON.stringify(row),
        validationStatus: 'pending',
      }));
      await db('import_set_rows').insert(rowData);
    }

    if (mappings?.length) {
      await db('import_mappings').where({ importSetId: id }).del();
      const mapData = mappings.map((m, i) => ({
        id: uuidv4(),
        importSetId: id,
        sourceField: m.sourceField,
        targetField: m.targetField,
        transformRule: m.transformRule,
        required: m.required || false,
        orderIndex: i,
      }));
      await db('import_mappings').insert(mapData);
    }

    await db('import_sets').where({ id }).update({
      status: 'uploaded',
      updatedAt: new Date().toISOString(),
    });

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'import',
      entityId: id,
      action: 'uploaded',
      beforeData: importSet,
      afterData: {
        status: 'uploaded',
        rowCount: rows?.length || 0,
        mappingCount: mappings?.length || 0,
      },
    });

    return success({ message: 'Data uploaded' });
  } catch (error) {
    return handleApiError(error);
  }
}
