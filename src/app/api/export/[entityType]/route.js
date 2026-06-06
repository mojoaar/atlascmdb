import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, success } from '../../../../lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
  const tableMap = {
    services: 'service_base',
    applications: 'application_base',
    cis: 'ci_base',
    teams: 'teams',
    locations: 'locations',
    assets: 'assets',
    roles: 'roles',
    users: 'users',
    themes: 'themes',
    relationships: 'relationships',
  };

    const entityType = (await params).entityType;
    const table = tableMap[entityType];
    if (!table) return NextResponse.json({ error: 'Unknown entity type' }, { status: 400 });

    if (entityType === 'users' && auth.effectiveRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let rows = await db(table).select('*');
    if (entityType === 'users') {
      const SENSITIVE = ['passwordHash', 'mfaSecret', 'passwordResetToken', 'passwordResetExpires'];
      rows = rows.map(r => { SENSITIVE.forEach(c => delete r[c]); return r; });
    }
    return success(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
