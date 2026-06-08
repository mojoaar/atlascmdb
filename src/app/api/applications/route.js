import { NextResponse } from 'next/server';
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
    const lifecycleStatus = searchParams.get('lifecycleStatus');
    const environment = searchParams.get('environment');
    const classification = searchParams.get('classification');
    const appType = searchParams.get('appType');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    let query = db('application_base')
      .leftJoin('teams', 'application_base.ownerTeamId', 'teams.id')
      .leftJoin('applications', 'application_base.id', 'applications.applicationBaseId')
      .leftJoin('users as creator', 'application_base.createdBy', 'creator.id')
      .leftJoin('users as updater', 'application_base.updatedBy', 'updater.id')
      .select(
        'application_base.*',
        'teams.name as ownerTeamName',
        'creator.displayName as createdByName',
        'updater.displayName as updatedByName',
        'applications.id as childId',
        'applications.appType',
        'applications.technologyStack'
      );

    if (lifecycleStatus) query = query.where('application_base.lifecycleStatus', lifecycleStatus);
    if (environment) query = query.where('application_base.environment', environment);
    if (classification) query = query.where('application_base.classification', classification);
    if (appType) query = query.where('applications.appType', appType);

    if (search) {
      query = query.where(function () {
        this.where('application_base.name', opLike, `%${search}%`)
          .orWhere('application_base.description', opLike, `%${search}%`);
      });
    }

    const ALLOWED_SORT = { name:'application_base.name', lifecycleStatus:'application_base.lifecycleStatus', environment:'application_base.environment', updatedAt:'application_base.updatedAt', vendor:'application_base.vendor', version:'application_base.version', ownerTeamName:'teams.name', appType:'applications.appType', createdByName:'creator.displayName', updatedByName:'updater.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.name;

    if (filterJson) {
      try {
        const ALLOWED_FIELDS = new Set(['name', 'description', 'lifecycleStatus', 'environment', 'classification', 'version', 'vendor', 'appType', 'ownerTeamId', 'technologyStack', 'ownerTeamName', 'id', 'createdAt', 'updatedAt', 'createdByName', 'updatedByName']);
        const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
        const FIELD_COL = {
          name: 'application_base.name',
          description: 'application_base.description',
          lifecycleStatus: 'application_base.lifecycleStatus',
          environment: 'application_base.environment',
          classification: 'application_base.classification',
          version: 'application_base.version',
          vendor: 'application_base.vendor',
          appType: 'applications.appType',
          ownerTeamId: 'application_base.ownerTeamId',
          technologyStack: 'applications.technologyStack',
          ownerTeamName: 'teams.name',
          id: 'application_base.id',
          createdAt: 'application_base.createdAt',
          updatedAt: 'application_base.updatedAt',
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
          else if (op === 'contains') query = query.where(col, opLike, `%${value}%`);
          else if (op === 'startsWith') query = query.where(col, opLike, `${value}%`);
          else if (op === 'isEmpty') query = query.whereNull(col).orWhere(col, '');
        });
      } catch {}
    }

    const [countResult] = await query.clone().clearSelect().count('* as total');
    const sortCol = ALLOWED_SORT[sort] || DEFAULT_SORT;
    const sortOrder = ['asc','desc'].includes(order) ? order : 'desc';
    
    let orderByQuery = query;
    if (sortCol === 'application_base.name') {
      orderByQuery = orderByQuery.orderByRaw(`LOWER(application_base.name) ${sortOrder}`);
    } else {
      orderByQuery = orderByQuery.orderBy(sortCol, sortOrder);
    }
    const rows = await orderByQuery.limit(limit).offset(offset);

    const apps = rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      ownerTeamId: r.ownerTeamId,
      ownerTeamName: r.ownerTeamName,
      lifecycleStatus: r.lifecycleStatus,
      environment: r.environment,
      vendor: r.vendor,
      version: r.version,
      classification: r.classification,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      archivedAt: r.archivedAt,
      createdBy: r.createdBy,
      updatedBy: r.updatedBy,
      createdByName: r.createdByName,
      updatedByName: r.updatedByName,
      appType: r.appType,
      technologyStack: r.technologyStack,
    }));

    return success({ data: apps, total: Number(countResult.total), limit, offset });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch applications');
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { name, description, ownerTeamId, lifecycleStatus, environment, vendor, version, classification, appType, technologyStack } = await request.json();

    if (!name) return badRequest('name required');

    const baseId = uuidv4();

    await db.transaction(async (trx) => {
      await trx('application_base').insert({
        id: baseId,
        name,
        description,
        ownerTeamId: ownerTeamId === '' ? null : ownerTeamId,
        lifecycleStatus,
        environment,
        vendor,
        version,
        classification,
        createdBy: auth.user.id,
      });
      await trx('applications').insert({
        id: uuidv4(), applicationBaseId: baseId, appType, technologyStack,
      });
    });

    const app = await db('application_base').where({ id: baseId }).first();

    await logAudit({
      actorUserId: auth.user.id, entityType: 'application', entityId: baseId,
      action: 'created', afterData: app,
    });

    return created({ ...app, appType, technologyStack });
  } catch (error) {
    return handleApiError(error, 'Failed to create application');
  }
}
