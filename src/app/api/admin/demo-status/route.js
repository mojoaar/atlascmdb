import getDb from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/rbac';
import { success, handleApiError, guardResponse } from '../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);
    
    const db = getDb();
    // Services only exist if full demo dataset has been seeded
    const [{ count }] = await db('service_base').count('* as count');
    const isDemoSeeded = Number(count) > 0;
    
    return success({ isDemoSeeded });
  } catch (err) {
    return handleApiError(err);
  }
}
