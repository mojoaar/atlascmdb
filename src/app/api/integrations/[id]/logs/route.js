import getDb from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/rbac';
import { handleApiError, success, notFound, guardResponse } from '../../../../../lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { id } = await params;
    const connector = await db('integration_connectors').where({ id }).first();

    if (!connector) return notFound('Integration connector');

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const [countResult] = await db('integration_sync_logs')
      .where({ connectorId: id })
      .count('* as total');

    const logs = await db('integration_sync_logs')
      .where({ connectorId: id })
      .orderBy('startedAt', 'desc')
      .limit(limit)
      .offset(offset);

    return success({
      data: logs,
      total: countResult.total,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
