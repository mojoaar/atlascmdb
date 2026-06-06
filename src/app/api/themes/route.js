import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAuth, requireAdmin } from '../../../lib/rbac';
import { handleApiError, success, created, guardResponse } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    const ALLOWED_SORT = { name: 'themes.name', status: 'themes.status', isDefault: 'themes.isDefault', createdByName:'creator.displayName', updatedByName:'updater.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.name;

    let query = db('themes')
      .leftJoin('users as creator', 'themes.createdBy', 'creator.id')
      .leftJoin('users as updater', 'themes.updatedBy', 'updater.id')
      .select('themes.*', 'creator.displayName as createdByName', 'updater.displayName as updatedByName');
    if (search) query = query.where('name', 'like', `%${search}%`);
    const [countResult] = await query.clone().count('* as total');
    const sortCol = ALLOWED_SORT[sort] || DEFAULT_SORT;
    const sortOrder = ['asc', 'desc'].includes(order) ? order : 'asc';
    const themes = await query.orderBy(sortCol, sortOrder).limit(limit).offset(offset);

    return success({ data: themes, total: countResult.total, limit, offset });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { name, tokenSetLight, tokenSetDark, isDefault, isSystem } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const id = uuidv4();
    const insert = { id, name, isDefault: isDefault || false, isSystem: isSystem || false, status: 'active', createdBy: auth.user.id };
    if (tokenSetLight) insert.tokenSetLight = typeof tokenSetLight === 'string' ? tokenSetLight : JSON.stringify(tokenSetLight);
    if (tokenSetDark) insert.tokenSetDark = typeof tokenSetDark === 'string' ? tokenSetDark : JSON.stringify(tokenSetDark);
    await db('themes').insert(insert);

    await logAudit({
      actorUserId: auth.user.id, entityType: 'theme', entityId: id,
      action: 'created', afterData: { name },
    });

    return created({ id, name });
  } catch (error) {
    return handleApiError(error, 'Failed to create theme');
  }
}
