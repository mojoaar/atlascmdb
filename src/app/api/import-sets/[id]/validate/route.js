import getDb from '../../../../../lib/db';
import { requireEditor } from '../../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const importSet = await db('import_sets').where({ id: (await params).id }).first();
    if (!importSet) return notFound('Import Set');

    const rows = await db('import_set_rows').where({ importSetId: (await params).id }).orderBy('rowNumber');
    let validCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      if (!row.mappedData) {
        await db('import_set_rows').where({ id: row.id }).update({
          validationStatus: 'error',
          errorMessages: JSON.stringify(['No mapped data']),
          updatedAt: new Date().toISOString(),
        });
        errorCount++;
        continue;
      }

      const mappedData = JSON.parse(row.mappedData);
      if (!mappedData.name) {
        await db('import_set_rows').where({ id: row.id }).update({
          validationStatus: 'error',
          errorMessages: JSON.stringify(['name is required']),
          updatedAt: new Date().toISOString(),
        });
        errorCount++;
        continue;
      }

      validCount++;
    }

    await db('import_sets').where({ id: (await params).id }).update({
      status: 'validated',
      updatedAt: new Date().toISOString(),
    });

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'import',
      entityId: (await params).id,
      action: 'validated',
      beforeData: null,
      afterData: { validCount, errorCount },
    });

    return success({ validCount, errorCount });
  } catch (error) {
    return handleApiError(error);
  }
}
