import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAuth, requireEditor } from '../../../lib/rbac';
import { handleApiError, success, created, guardResponse, forbidden, badRequest } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    let query = db('teams')
      .leftJoin('teams as parent', 'teams.parentTeamId', 'parent.id')
      .leftJoin('roles', 'teams.roleId', 'roles.id')
      .leftJoin('users as manager', 'teams.managerId', 'manager.id')
      .leftJoin('users as lead', 'teams.leadId', 'lead.id')
      .leftJoin('users as creator', 'teams.createdBy', 'creator.id')
      .leftJoin('users as updater', 'teams.updatedBy', 'updater.id')
      .select('teams.*', 'parent.name as parentTeamName', 'roles.name as roleName', 'manager.displayName as managerName', 'lead.displayName as leadName', 'creator.displayName as createdByName', 'updater.displayName as updatedByName');

    if (type) query = query.where('teams.type', type);
    if (status) query = query.where('teams.status', status);

    if (search) {
      query = query.where(function () {
        this.where('teams.name', 'like', `%${search}%`)
          .orWhere('teams.description', 'like', `%${search}%`);
      });
    }

    const ALLOWED_SORT = { name:'teams.name', type:'teams.type', status:'teams.status', createdAt:'teams.createdAt', roleName:'roles.name', parentTeamName:'parent.name', managerName:'manager.displayName', leadName:'lead.displayName', createdByName:'creator.displayName', updatedByName:'updater.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.name;

    if (filterJson) {
      try {
        const ALLOWED_FIELDS = new Set(['name', 'description', 'type', 'status', 'roleName', 'parentTeamName', 'managerName', 'leadName', 'createdByName', 'updatedByName']);
        const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
        const FIELD_COL = {
          name: 'teams.name', description: 'teams.description',
          type: 'teams.type', status: 'teams.status',
          roleName: 'roles.name', parentTeamName: 'parent.name',
          managerName: 'manager.displayName', leadName: 'lead.displayName',
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
    const sortOrder = ['asc','desc'].includes(order) ? order : 'asc';
    
    let orderByQuery = query;
    if (sortCol === 'teams.name') {
      orderByQuery = orderByQuery.orderByRaw(`LOWER(teams.name) ${sortOrder}`);
    } else {
      orderByQuery = orderByQuery.orderBy(sortCol, sortOrder);
    }
    const rows = await orderByQuery.limit(limit).offset(offset);

    return success({ data: rows, total: countResult.total, limit, offset });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch teams');
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { name, description, type, parentTeamId, ownershipScope, status, roleId, managerId, leadId } = await request.json();

    if (roleId && auth.effectiveRole !== 'admin') {
      return forbidden('Only administrators can assign roles to teams');
    }

    if (!name || !type) {
      return badRequest('name and type required');
    }

    const id = uuidv4();
    await db('teams').insert({
      id,
      name,
      description,
      type,
      parentTeamId: parentTeamId === '' ? null : parentTeamId,
      ownershipScope,
      status: status || 'active',
      roleId: roleId === '' ? null : roleId,
      managerId: managerId === '' ? null : managerId,
      leadId: leadId === '' ? null : leadId,
      createdBy: auth.user.id,
    });

    await logAudit({
      actorUserId: auth.user.id, entityType: 'team', entityId: id,
      action: 'created', afterData: { name, type },
    });

    return created({ id, name, type });
  } catch (error) {
    return handleApiError(error, 'Failed to create team');
  }
}
