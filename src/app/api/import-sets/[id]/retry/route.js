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

    const errorRows = await db('import_set_rows')
      .where({ importSetId: (await params).id, validationStatus: 'error' });

    if (!errorRows.length) return success({ message: 'No rows to retry' });

    const mappings = await db('import_mappings').where({ importSetId: (await params).id }).orderBy('orderIndex');

    let fixed = 0;
    for (const row of errorRows) {
      const sourceData = JSON.parse(row.sourceData);
      const mappedData = {};
      const errorMessages = [];

      for (const mapping of mappings) {
        const sourceValue = sourceData[mapping.sourceField];
        if (mapping.required && !sourceValue) {
          errorMessages.push(`${mapping.sourceField} is required`);
          continue;
        }
        mappedData[mapping.targetField] = mapping.transformRule === 'uppercase'
          ? String(sourceValue).toUpperCase()
          : mapping.transformRule === 'lowercase'
            ? String(sourceValue).toLowerCase()
            : sourceValue;
      }

      const status = errorMessages.length ? 'error' : 'valid';
      await db('import_set_rows').where({ id: row.id }).update({
        mappedData: JSON.stringify(mappedData),
        validationStatus: status,
        errorMessages: errorMessages.length ? JSON.stringify(errorMessages) : null,
        updatedAt: new Date().toISOString(),
      });

      if (status === 'valid') fixed++;
    }

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'import',
      entityId: (await params).id,
      action: 'retried',
      beforeData: null,
      afterData: { retried: errorRows.length, fixed },
    });

    return success({ retried: errorRows.length, fixed });
  } catch (error) {
    return handleApiError(error);
  }
}
