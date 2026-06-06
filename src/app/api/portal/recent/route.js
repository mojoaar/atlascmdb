import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, success } from '../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();

    const recentServices = await db('service_base').orderBy('updatedAt', 'desc').limit(5).select('id', 'name', 'updatedAt');
    const recentApps = await db('application_base').orderBy('updatedAt', 'desc').limit(5).select('id', 'name', 'updatedAt');
    const recentCis = await db('ci_base').orderBy('updatedAt', 'desc').limit(5).select('id', 'name', 'updatedAt');

    const items = [
      ...recentServices.map(s => ({ type: 'service', id: s.id, name: s.name, updatedAt: s.updatedAt })),
      ...recentApps.map(a => ({ type: 'application', id: a.id, name: a.name, updatedAt: a.updatedAt })),
      ...recentCis.map(c => ({ type: 'ci', id: c.id, name: c.name, updatedAt: c.updatedAt })),
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);

    return success(items);
  } catch (error) {
    return handleApiError(error);
  }
}
