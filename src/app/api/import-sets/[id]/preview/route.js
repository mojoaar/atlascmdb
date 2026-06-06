import getDb from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../../lib/api-helpers';

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const importSet = await db('import_sets').where({ id: (await params).id }).first();
    if (!importSet) return notFound('Import Set');

    const validRows = await db('import_set_rows')
      .where({ importSetId: (await params).id, validationStatus: 'valid' })
      .orderBy('rowNumber');

    const preview = validRows.map(row => {
      const mapped = JSON.parse(row.mappedData || '{}');
      return { rowNumber: row.rowNumber, mappedData: mapped, destinationTable: row.destinationTable || 'service_base' };
    });

    return success({ preview, rowCount: preview.length });
  } catch (error) {
    return handleApiError(error);
  }
}
