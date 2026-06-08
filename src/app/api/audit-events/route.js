import getDb, { likeOperator } from '../../../lib/db';
import { requireAdmin } from '../../../lib/rbac';
import { handleApiError, success, guardResponse } from '../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const opLike = likeOperator(db);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'desc').toLowerCase();
    const search = searchParams.get('search');
    const filterJson = searchParams.get('filter');

    const ALLOWED_FIELDS = new Set(['actorName', 'action', 'entityType', 'entityId']);
    const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
    const FIELD_COL = {
      actorName: 'users.displayName', action: 'audit_events.action',
      entityType: 'audit_events.entityType', entityId: 'audit_events.entityId',
    };
    const filters = filterJson ? (() => { try { return JSON.parse(filterJson); } catch { return []; } })() : [];
    const ALLOWED_SORT = { createdAt:'audit_events.createdAt', action:'audit_events.action', entityType:'audit_events.entityType', actorName:'users.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.createdAt;

    let query = db('audit_events')
      .leftJoin('users', 'audit_events.actorUserId', 'users.id')
      .select('audit_events.*', 'users.displayName as actorName', 'users.email as actorEmail');

    if (entityType) query = query.where('audit_events.entityType', entityType);
    if (entityId) query = query.where('audit_events.entityId', entityId);

    if (search) {
      query = query.where(function () {
        this.where('users.displayName', opLike, `%${search}%`)
          .orWhere('users.email', opLike, `%${search}%`);
      });
    }

    filters.forEach(({ field, op, value }) => {
      if (!ALLOWED_FIELDS.has(field) || !VALID_OPS.has(op)) return;
      const col = FIELD_COL[field];
      if (!col) return;
      if (op === 'eq') query = query.where(col, value);
      else if (op === 'neq') query = query.whereNot(col, value);
      else if (op === 'contains') query = query.where(col, opLike, `%${value}%`);
      else if (op === 'startsWith') query = query.where(col, opLike, `${value}%`);
      else if (op === 'isEmpty') query = query.whereNull(col).orWhere(col, '');
    });

    const [countResult] = await query.clone().clearSelect().count('* as total');
    const sortCol = ALLOWED_SORT[sort] || DEFAULT_SORT;
    const sortOrder = ['asc','desc'].includes(order) ? order : 'desc';
    const events = await query.orderBy(sortCol, sortOrder).limit(limit).offset(offset);

    return success({ data: events, total: Number(countResult.total), limit, offset });
  } catch (error) {
    return handleApiError(error);
  }
}
