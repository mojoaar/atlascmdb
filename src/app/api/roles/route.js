import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAdmin } from '../../../lib/rbac';
import { handleApiError, success, created, guardResponse } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

export async function GET(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    const ALLOWED_SORT = { name:'roles.name', createdByName:'creator.displayName', updatedByName:'updater.displayName', createdAt:'roles.createdAt' };
    const DEFAULT_SORT = ALLOWED_SORT.name;

    let query = db('roles')
      .leftJoin('users as creator', 'roles.createdBy', 'creator.id')
      .leftJoin('users as updater', 'roles.updatedBy', 'updater.id')
      .select('roles.*', 'creator.displayName as createdByName', 'updater.displayName as updatedByName');

    if (search) {
      query = query.where(function () {
        this.where('roles.name', 'like', `%${search}%`)
          .orWhere('roles.description', 'like', `%${search}%`);
      });
    }

    if (filterJson) {
      try {
        const ALLOWED_FIELDS = new Set(['name', 'description', 'createdByName', 'updatedByName']);
        const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
        const FIELD_COL = {
          name: 'roles.name',
          description: 'roles.description',
          createdByName: 'creator.displayName',
          updatedByName: 'updater.displayName',
        };
        JSON.parse(filterJson).forEach(({ field, op, value }) => {
          if (!ALLOWED_FIELDS.has(field) || !VALID_OPS.has(op)) return;
          const col = FIELD_COL[field];
          if (!col) return;
          if (op === 'eq') query = query.where(col, value);
          else if (op === 'neq') query = query.whereNot(col, value);
          else if (op === 'contains') query = query.where(col, 'like', `%${value}%`);
          else if (op === 'startsWith') query = query.where(col, 'like', `${value}%`);
          else if (op === 'isEmpty') query = query.whereNull(col).orWhere(col, '');
        });
      } catch {}
    }

    const [countResult] = await query.clone().clearSelect().count('* as total');
    const sortCol = ALLOWED_SORT[sort] || DEFAULT_SORT;
    const sortOrder = ['asc', 'desc'].includes(order) ? order : 'asc';
    const roles = await query.orderBy(sortCol, sortOrder).limit(limit).offset(offset);

    return success({ data: roles, total: Number(countResult.total), limit, offset });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { name, description } = await request.json();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const db = getDb();
    const id = uuidv4();
    await db('roles').insert({ id, name, description, createdBy: auth.user.id });
    await logAudit({
      actorUserId: auth.user.id, entityType: 'role', entityId: id,
      action: 'created', afterData: { name, description },
    });
    return created({ id, name, description });
  } catch (error) {
    return handleApiError(error);
  }
}
