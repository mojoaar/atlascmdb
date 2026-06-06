import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/rbac';
import { success, guardResponse } from '../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const templates = [
      { name: 'Services', entityType: 'services', fields: ['name', 'description', 'ownerTeamId', 'lifecycleStatus', 'environment', 'classification'] },
      { name: 'Applications', entityType: 'applications', fields: ['name', 'description', 'ownerTeamId', 'lifecycleStatus', 'vendor', 'version'] },
      { name: 'CIs', entityType: 'cis', fields: ['name', 'description', 'ownerTeamId', 'locationId', 'lifecycleStatus', 'externalRef'] },
    ];

    return success(templates);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
