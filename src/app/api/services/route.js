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
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const lifecycleStatus = searchParams.get('lifecycleStatus');
    const environment = searchParams.get('environment');
    const classification = searchParams.get('classification');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    let query = db('service_base')
      .leftJoin('teams', 'service_base.ownerTeamId', 'teams.id')
      .leftJoin('business_services', 'service_base.id', 'business_services.serviceBaseId')
      .leftJoin('technical_services', 'service_base.id', 'technical_services.serviceBaseId')
      .leftJoin('users as creator', 'service_base.createdBy', 'creator.id')
      .leftJoin('users as updater', 'service_base.updatedBy', 'updater.id')
      .select(
        'service_base.*',
        'teams.name as ownerTeamName',
        'creator.displayName as createdByName',
        'updater.displayName as updatedByName',
        'business_services.id as businessServiceId',
        'business_services.businessCriticality',
        'business_services.businessOwner',
        'business_services.serviceTier',
        'technical_services.id as technicalServiceId',
        'technical_services.supportModel',
        'technical_services.serviceCategory'
      );

    if (type === 'business') {
      query = query.whereNotNull('business_services.id');
    } else if (type === 'technical') {
      query = query.whereNotNull('technical_services.id');
    }

    if (lifecycleStatus) query = query.where('service_base.lifecycleStatus', lifecycleStatus);
    if (environment) query = query.where('service_base.environment', environment);
    if (classification) query = query.where('service_base.classification', classification);

    if (search) {
      query = query.where(function () {
        this.where('service_base.name', 'like', `%${search}%`)
          .orWhere('service_base.description', 'like', `%${search}%`);
      });
    }

    const ALLOWED_SORT = { name:'service_base.name', lifecycleStatus:'service_base.lifecycleStatus', environment:'service_base.environment', updatedAt:'service_base.updatedAt', createdAt:'service_base.createdAt', ownerTeamName:'teams.name', createdByName:'creator.displayName', updatedByName:'updater.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.name;

    if (filterJson) {
      try {
        const ALLOWED_FIELDS = new Set(['name', 'description', 'lifecycleStatus', 'environment', 'classification', 'ownerTeamId', 'ownerTeamName', 'id', 'createdAt', 'updatedAt', 'createdByName', 'updatedByName']);
        const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
        const FIELD_COL = {
          name: 'service_base.name',
          description: 'service_base.description',
          lifecycleStatus: 'service_base.lifecycleStatus',
          environment: 'service_base.environment',
          classification: 'service_base.classification',
          ownerTeamId: 'service_base.ownerTeamId',
          ownerTeamName: 'teams.name',
          id: 'service_base.id',
          createdAt: 'service_base.createdAt',
          updatedAt: 'service_base.updatedAt',
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

    const services = rows.map(r => {
      const service = {
        id: r.id,
        name: r.name,
        description: r.description,
        ownerTeamId: r.ownerTeamId,
        ownerTeamName: r.ownerTeamName,
        lifecycleStatus: r.lifecycleStatus,
        environment: r.environment,
        classification: r.classification,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        archivedAt: r.archivedAt,
        createdBy: r.createdBy,
        updatedBy: r.updatedBy,
        createdByName: r.createdByName,
        updatedByName: r.updatedByName,
        type: r.businessServiceId ? 'business' : r.technicalServiceId ? 'technical' : 'unknown',
        businessServiceId: r.businessServiceId || null,
        technicalServiceId: r.technicalServiceId || null,
        typeSpecific: r.businessServiceId ? {
          businessCriticality: r.businessCriticality,
          businessOwner: r.businessOwner,
          serviceTier: r.serviceTier,
        } : r.technicalServiceId ? {
          supportModel: r.supportModel,
          serviceCategory: r.serviceCategory,
        } : {},
      };
      return service;
    });

    return success({ data: services, total: countResult.total, limit, offset });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch services');
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const body = await request.json();
    const { name, description, ownerTeamId, lifecycleStatus, environment, classification, type, typeFields } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'name and type (business|technical) required' }, { status: 400 });
    }

    const baseId = uuidv4();

    await db.transaction(async (trx) => {
      await trx('service_base').insert({
        id: baseId, name, description, ownerTeamId, lifecycleStatus, environment, classification,
        createdBy: auth.user.id,
      });

      if (type === 'business') {
        await trx('business_services').insert({
          id: uuidv4(), serviceBaseId: baseId,
          businessCriticality: typeFields?.businessCriticality,
          businessOwner: typeFields?.businessOwner,
          serviceTier: typeFields?.serviceTier,
        });
      } else if (type === 'technical') {
        await trx('technical_services').insert({
          id: uuidv4(), serviceBaseId: baseId,
          supportModel: typeFields?.supportModel,
          serviceCategory: typeFields?.serviceCategory,
        });
      }
    });

    const service = await db('service_base').where({ id: baseId }).first();

    await logAudit({
      actorUserId: auth.user.id, entityType: 'service', entityId: baseId,
      action: 'created', afterData: service,
    });

    return created({ ...service, type, typeFields });
  } catch (error) {
    return handleApiError(error, 'Failed to create service');
  }
}
