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
    const lifecycleStatus = searchParams.get('lifecycleStatus');
    const environment = searchParams.get('environment');
    const ciType = searchParams.get('ciType');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    let query = db('ci_base')
      .leftJoin('teams', 'ci_base.ownerTeamId', 'teams.id')
      .leftJoin('locations', 'ci_base.locationId', 'locations.id')
      .leftJoin('cis', 'ci_base.id', 'cis.ciBaseId')
      .leftJoin('users as creator', 'ci_base.createdBy', 'creator.id')
      .leftJoin('users as updater', 'ci_base.updatedBy', 'updater.id')
      .select(
        'ci_base.*',
        'teams.name as ownerTeamName',
        'locations.name as locationName',
        'creator.displayName as createdByName',
        'updater.displayName as updatedByName',
        'cis.id as childId', 'cis.ciType', 'cis.serialNumber', 'cis.assetTag', 'cis.rackSize', 'cis.rackModel'
      );

    if (lifecycleStatus) query = query.where('ci_base.lifecycleStatus', lifecycleStatus);
    if (environment) query = query.where('ci_base.environment', environment);
    if (ciType) query = query.where('cis.ciType', ciType);

    if (search) {
      query = query.where(function () {
        this.where('ci_base.name', 'like', `%${search}%`)
          .orWhere('ci_base.description', 'like', `%${search}%`);
      });
    }

    const ALLOWED_SORT = { name:'ci_base.name', ciType:'cis.ciType', lifecycleStatus:'ci_base.lifecycleStatus', environment:'ci_base.environment', updatedAt:'ci_base.updatedAt', locationName:'locations.name', createdByName:'creator.displayName', updatedByName:'updater.displayName', rackSize:'cis.rackSize' };
    const DEFAULT_SORT = ALLOWED_SORT.name;

    if (filterJson) {
      try {
        const ALLOWED_FIELDS = new Set(['name', 'description', 'lifecycleStatus', 'environment', 'classification', 'ciType', 'serialNumber', 'assetTag', 'rackSize', 'rackModel', 'locationId', 'locationName', 'id', 'createdAt', 'updatedAt', 'createdByName', 'updatedByName']);
        const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
        const FIELD_COL = {
          name: 'ci_base.name',
          description: 'ci_base.description',
          lifecycleStatus: 'ci_base.lifecycleStatus',
          environment: 'ci_base.environment',
          classification: 'ci_base.classification',
          ciType: 'cis.ciType',
          serialNumber: 'cis.serialNumber',
          assetTag: 'cis.assetTag',
          rackSize: 'cis.rackSize',
          rackModel: 'cis.rackModel',
          locationId: 'ci_base.locationId',
          locationName: 'locations.name',
          id: 'ci_base.id',
          createdAt: 'ci_base.createdAt',
          updatedAt: 'ci_base.updatedAt',
          createdByName: 'creator.displayName',
          updatedByName: 'updater.displayName',
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

    const cis = rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      ownerTeamId: r.ownerTeamId,
      ownerTeamName: r.ownerTeamName,
      locationId: r.locationId,
      locationName: r.locationName,
      lifecycleStatus: r.lifecycleStatus,
      environment: r.environment,
      classification: r.classification,
      externalRef: r.externalRef,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      archivedAt: r.archivedAt,
      createdBy: r.createdBy,
      updatedBy: r.updatedBy,
      createdByName: r.createdByName,
      updatedByName: r.updatedByName,
      ciType: r.ciType,
      serialNumber: r.serialNumber,
      assetTag: r.assetTag,
      rackSize: r.rackSize,
      rackModel: r.rackModel,
    }));

    return success({ data: cis, total: countResult.total, limit, offset });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch CIs');
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const { name, description, ownerTeamId, locationId, lifecycleStatus, environment, classification, externalRef, ciType, serialNumber, assetTag, rackSize, rackModel } = await request.json();

    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const baseId = uuidv4();

    await db.transaction(async (trx) => {
      await trx('ci_base').insert({
        id: baseId, name, description, ownerTeamId, locationId, lifecycleStatus, environment, classification, externalRef,
        createdBy: auth.user.id,
      });
      await trx('cis').insert({
        id: uuidv4(), ciBaseId: baseId, ciType, serialNumber, assetTag,
        rackSize: rackSize || null,
        rackModel: rackModel || null,
      });
    });

    const ci = await db('ci_base').where({ id: baseId }).first();

    await logAudit({
      actorUserId: auth.user.id, entityType: 'ci', entityId: baseId,
      action: 'created', afterData: ci,
    });

    return created({ ...ci, ciType, serialNumber, assetTag, rackSize, rackModel });
  } catch (error) {
    return handleApiError(error, 'Failed to create CI');
  }
}
