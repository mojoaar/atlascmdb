import getDb from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/rbac';
import { handleApiError, success, guardResponse } from '../../../../../lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const rows = await db('import_set_rows')
      .where({ importSetId: (await params).id })
      .whereNot({ destinationRecordId: null })
      .orderBy('rowNumber');

    return success(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
