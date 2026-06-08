import { v4 as uuidv4 } from 'uuid';
import getDb, { likeOperator } from '../../../lib/db';
import { requireAuth, requireEditor } from '../../../lib/rbac';
import { handleApiError, success, created, guardResponse, badRequest } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const opLike = likeOperator(db);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    let query = db('locations')
      .leftJoin('locations as parent', 'locations.parentLocationId', 'parent.id')
      .leftJoin('users as creator', 'locations.createdBy', 'creator.id')
      .leftJoin('users as updater', 'locations.updatedBy', 'updater.id')
      .select('locations.*', 'parent.name as parentLocationName', 'creator.displayName as createdByName', 'updater.displayName as updatedByName');

    if (type) query = query.where('locations.type', type);
    if (status) query = query.where('locations.status', status);

    if (search) {
      query = query.where(function () {
        this.where('locations.name', opLike, `%${search}%`)
          .orWhere('locations.description', opLike, `%${search}%`);
      });
    }

    const ALLOWED_SORT = { name:'locations.name', type:'locations.type', status:'locations.status', parentLocationName:'parent.name', city:'locations.city', country:'locations.country', streetAddress:'locations.streetAddress', postalCode:'locations.postalCode', stateProvince:'locations.stateProvince', createdByName:'creator.displayName', updatedByName:'updater.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.name;

    if (filterJson) {
      try {
const ALLOWED_FIELDS = new Set(['name', 'description', 'type', 'status', 'parentLocationName', 'city', 'country', 'streetAddress', 'stateProvince', 'postalCode', 'createdByName', 'updatedByName']);
    const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
    const FIELD_COL = {
      name: 'locations.name', description: 'locations.description',
      type: 'locations.type', status: 'locations.status',
      parentLocationName: 'parent.name',
      city: 'locations.city', country: 'locations.country',
      streetAddress: 'locations.streetAddress', stateProvince: 'locations.stateProvince',
      postalCode: 'locations.postalCode',
      createdByName: 'creator.displayName', updatedByName: 'updater.displayName',
    };
        JSON.parse(filterJson).forEach(({ field, op, value }) => {
          if (!ALLOWED_FIELDS.has(field) || !VALID_OPS.has(op)) return;
          const col = FIELD_COL[field];
          if (!col) return;
          if (op === 'eq') query = query.where(col, value);
          else if (op === 'neq') query = query.whereNot(col, value);
          else if (op === 'contains') query = query.where(col, opLike, `%${value}%`);
          else if (op === 'startsWith') query = query.where(col, opLike, `${value}%`);
          else if (op === 'isEmpty') query = query.whereNull(col).orWhere(col, '');
        });
      } catch {}
    }

    const [countResult] = await query.clone().clearSelect().count('* as total');
    const sortCol = ALLOWED_SORT[sort] || DEFAULT_SORT;
    const sortOrder = ['asc','desc'].includes(order) ? order : 'asc';
    
    let orderByQuery = query;
    if (sortCol === 'locations.name') {
      orderByQuery = orderByQuery.orderByRaw(`LOWER(locations.name) ${sortOrder}`);
    } else {
      orderByQuery = orderByQuery.orderBy(sortCol, sortOrder);
    }
    const rows = await orderByQuery.limit(limit).offset(offset);

    return success({ data: rows, total: Number(countResult.total), limit, offset });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch locations');
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { name, description, type, parentLocationId, status, latitude, longitude, streetAddress, city, stateProvince, postalCode, country } = await request.json();
    if (!name) return badRequest('name required');

    const coercedParentId = parentLocationId || null;

    const id = uuidv4();
    await db('locations').insert({ id, name, description, type, parentLocationId: coercedParentId, status: status || 'active', latitude, longitude, streetAddress, city, stateProvince, postalCode, country, createdBy: auth.user.id });

    await logAudit({
      actorUserId: auth.user.id, entityType: 'location', entityId: id,
      action: 'created', afterData: { name, type },
    });

    return created({ id, name, type });
  } catch (error) {
    return handleApiError(error, 'Failed to create location');
  }
}
