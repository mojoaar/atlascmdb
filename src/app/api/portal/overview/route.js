import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, success } from '../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

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
      services: serviceCount.total,
      applications: appCount.total,
      cis: ciCount.total,
      teams: teamCount.total,
      locations: locationCount.total,
      imports: importCount.total,
      users: userCount.total,
      roles: roleCount.total,
      assets: assetCount.total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
