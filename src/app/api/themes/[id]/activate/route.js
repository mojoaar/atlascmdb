import getDb from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const theme = await db('themes').where({ id: (await params).id }).first();
    if (!theme) return notFound('Theme');

    await db('themes').where({ isDefault: true }).update({ isDefault: false });
    await db('themes').where({ id: (await params).id }).update({ isDefault: true });

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'theme',
      entityId: (await params).id,
      action: 'activated',
      beforeData: null,
      afterData: { name: theme.name },
    });

    return success({ message: 'Theme activated' });
  } catch (error) {
    return handleApiError(error);
  }
}
