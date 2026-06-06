import getDb from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const event = await db('audit_events')
      .leftJoin('users', 'audit_events.actorUserId', 'users.id')
      .select('audit_events.*', 'users.displayName as actorName', 'users.email as actorEmail')
      .where('audit_events.id', (await params).id)
      .first();

    if (!event) return notFound('Audit Event');

    return success(event);
  } catch (error) {
    return handleApiError(error);
  }
}
