import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAuth, requireEditor } from '../../../lib/rbac';
import { handleApiError, success, created } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get('sourceType');
    const sourceId = searchParams.get('sourceId');
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const search = searchParams.get('search');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    let query = db('relationships')
      .leftJoin('users as creator', 'relationships.createdBy', 'creator.id')
      .leftJoin('users as updater', 'relationships.updatedBy', 'updater.id')
      .select('relationships.*', 'creator.displayName as createdByName', 'updater.displayName as updatedByName');

    if (sourceType) query = query.where('relationships.sourceType', sourceType);
    if (sourceId) query = query.where('relationships.sourceId', sourceId);
    if (targetType) query = query.where('relationships.targetType', targetType);
    if (targetId) query = query.where('relationships.targetId', targetId);

    if (search) {
      query = query.where(function () {
        this.where('relationships.relationshipType', 'like', `%${search}%`)
          .orWhere('relationships.notes', 'like', `%${search}%`);
      });
    }

    const ALLOWED_SORT = { sourceType:'relationships.sourceType', targetType:'relationships.targetType', relationshipType:'relationships.relationshipType', direction:'relationships.direction', createdAt:'relationships.createdAt', createdByName:'creator.displayName', updatedByName:'updater.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.createdAt;

    if (filterJson) {
      try {
        const ALLOWED_FIELDS = new Set(['sourceType', 'sourceId', 'targetType', 'targetId', 'relationshipType', 'direction', 'createdByName', 'updatedByName']);
        const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
        const FIELD_COL = {
          sourceType: 'relationships.sourceType', sourceId: 'relationships.sourceId',
          targetType: 'relationships.targetType', targetId: 'relationships.targetId',
          relationshipType: 'relationships.relationshipType', direction: 'relationships.direction',
          createdByName: 'creator.displayName', updatedByName: 'updater.displayName',
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

    const [countResult] = await query.clone().count('* as total');
    const sortCol = ALLOWED_SORT[sort] || DEFAULT_SORT;
    const sortOrder = ['asc','desc'].includes(order) ? order : 'desc';
    const rows = await query.orderBy(sortCol, sortOrder).limit(limit).offset(offset);

    return success({ data: rows, total: countResult.total, limit, offset });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch relationships');
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const { sourceType, sourceId, targetType, targetId, relationshipType, direction, notes } = await request.json();

    if (!sourceType || !sourceId || !targetType || !targetId) {
      return NextResponse.json({ error: 'sourceType, sourceId, targetType, targetId required' }, { status: 400 });
    }

    const id = uuidv4();
    await db('relationships').insert({
      id, sourceType, sourceId, targetType, targetId, relationshipType, direction, notes,
      createdBy: auth.user.id,
    });

    await logAudit({
      actorUserId: auth.user.id, entityType: 'relationship', entityId: id,
      action: 'created', afterData: { sourceType, sourceId, targetType, targetId, relationshipType },
    });

    return created({ id, sourceType, sourceId, targetType, targetId, relationshipType });
  } catch (error) {
    return handleApiError(error, 'Failed to create relationship');
  }
}
