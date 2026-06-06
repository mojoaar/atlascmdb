import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, success, notFound, guardResponse } from '../../../../lib/api-helpers';

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    const n = await db('notifications').where({ id, userId: auth.user.id }).first();
    if (!n) return notFound('Notification');

    await db('notifications').where({ id }).del();
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
