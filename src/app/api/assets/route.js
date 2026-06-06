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
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    let query = db('assets')
      .leftJoin('ci_base', 'assets.ciId', 'ci_base.id')
      .leftJoin('locations', 'assets.locationId', 'locations.id')
      .leftJoin('users', 'assets.assignedTo', 'users.id')
      .leftJoin('users as creator', 'assets.createdBy', 'creator.id')
      .leftJoin('users as updater', 'assets.updatedBy', 'updater.id')
      .select(
        'assets.*',
        'ci_base.name as ciName',
        'locations.name as locationName',
        'users.displayName as assignedToName',
        'creator.displayName as createdByName',
        'updater.displayName as updatedByName'
      );

    if (category) query = query.where('assets.category', category);
    if (status) query = query.where('assets.status', status);

    if (search) {
      query = query.where(function () {
        this.where('assets.name', 'like', `%${search}%`)
          .orWhere('assets.assetTag', 'like', `%${search}%`)
          .orWhere('assets.model', 'like', `%${search}%`)
          .orWhere('assets.supplier', 'like', `%${search}%`);
      });
    }

    const ALLOWED_SORT = { name:'assets.name', assetTag:'assets.assetTag', category:'assets.category', status:'assets.status', updatedAt:'assets.updatedAt', ciName:'ci_base.name', locationName:'locations.name', assignedToName:'users.displayName', createdByName:'creator.displayName', updatedByName:'updater.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.name;

    if (filterJson) {
      try {
        const ALLOWED_FIELDS = new Set(['name', 'assetTag', 'category', 'model', 'status', 'supplier', 'ciName', 'locationName', 'assignedToName', 'id', 'createdAt', 'updatedAt', 'createdByName', 'updatedByName']);
        const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
        const FIELD_COL = {
          name: 'assets.name', assetTag: 'assets.assetTag', category: 'assets.category',
          model: 'assets.model', status: 'assets.status', supplier: 'assets.supplier',
          ciName: 'ci_base.name', locationName: 'locations.name', assignedToName: 'users.displayName',
          id: 'assets.id', createdAt: 'assets.createdAt', updatedAt: 'assets.updatedAt',
          createdByName: 'creator.displayName', updatedByName: 'updater.displayName',
        };
        const conditions = JSON.parse(filterJson);
        conditions.forEach(({ field, op, value }) => {
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

    const assets = rows.map(r => ({
      id: r.id, name: r.name, assetTag: r.assetTag, ciId: r.ciId,
      ciName: r.ciName, category: r.category, model: r.model,
      status: r.status, assignedTo: r.assignedTo, assignedToName: r.assignedToName,
      locationId: r.locationId, locationName: r.locationName,
      supplier: r.supplier, purchaseDate: r.purchaseDate,
      warrantyExpiry: r.warrantyExpiry, cost: r.cost,
      notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt,
      createdBy: r.createdBy, updatedBy: r.updatedBy,
      createdByName: r.createdByName, updatedByName: r.updatedByName,
    }));

    return success({ data: assets, total: countResult.total, limit, offset });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch assets');
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const id = uuidv4();
    const fields = ['name', 'assetTag', 'ciId', 'category', 'model', 'status', 'assignedTo', 'locationId', 'supplier', 'purchaseDate', 'warrantyExpiry', 'cost', 'notes'];
    const insert = { id, createdBy: auth.user.id };
    fields.forEach(f => { if (body[f] !== undefined) insert[f] = body[f]; });

    await db('assets').insert(insert);

    await logAudit({
      actorUserId: auth.user.id, entityType: 'asset', entityId: id,
      action: 'created', afterData: insert,
    });

    const asset = await db('assets').where({ id }).first();
    return created(asset);
  } catch (error) {
    return handleApiError(error, 'Failed to create asset');
  }
}
