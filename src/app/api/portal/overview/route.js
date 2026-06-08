import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, success, guardResponse } from '../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const [serviceCount] = await db('service_base').count('* as total');
    const [appCount] = await db('application_base').count('* as total');
    const [ciCount] = await db('ci_base').count('* as total');
    const [teamCount] = await db('teams').count('* as total');
    const [locationCount] = await db('locations').count('* as total');
    const [importCount] = await db('import_sets').count('* as total');
    const [userCount] = await db('users').count('* as total');
    const [roleCount] = await db('roles').count('* as total');
    const [assetCount] = await db('assets').count('* as total');

    return success({
      services: Number(serviceCount.total),
      applications: Number(appCount.total),
      cis: Number(ciCount.total),
      teams: Number(teamCount.total),
      locations: Number(locationCount.total),
      imports: Number(importCount.total),
      users: Number(userCount.total),
      roles: Number(roleCount.total),
      assets: Number(assetCount.total),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
