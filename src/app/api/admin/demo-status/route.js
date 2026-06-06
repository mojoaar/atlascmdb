import db from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/rbac';
import { success, handleApiError } from '../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAdmin()(request);
    
    // Services only exist if full demo dataset has been seeded
    const [{ count }] = await db('service_base').count('* as count');
    const isDemoSeeded = Number(count) > 0;
    
    return success({ isDemoSeeded });
  } catch (err) {
    return handleApiError(err);
  }
}
