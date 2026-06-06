import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAdmin } from '../../../lib/rbac';
import { handleApiError, success, created, guardResponse, conflict, badRequest } from '../../../lib/api-helpers';
import { hashPassword } from '../../../lib/auth';
import { logAudit } from '../../../lib/audit';

export async function GET(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const filterJson = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();

    const ALLOWED_FIELDS = new Set(['displayName', 'email', 'status', 'mfaEnabled', 'managerName', 'roleName', 'createdByName', 'updatedByName']);
    const VALID_OPS = new Set(['eq', 'neq', 'contains', 'startsWith', 'isEmpty']);
    const FIELD_COL = {
      displayName: 'users.displayName', email: 'users.email',
      status: 'users.status', mfaEnabled: 'users.mfaEnabled',
      managerName: 'manager.displayName', roleName: 'roles.name',
      createdByName: 'creator.displayName', updatedByName: 'updater.displayName',
    };
    const ALLOWED_SORT = { displayName:'users.displayName', email:'users.email', status:'users.status', createdAt:'users.createdAt', managerName:'manager.displayName', createdByName:'creator.displayName', updatedByName:'updater.displayName' };
    const DEFAULT_SORT = ALLOWED_SORT.displayName;
    const filters = filterJson ? (() => { try { return JSON.parse(filterJson); } catch { return []; } })() : [];

    function applyFilters(q) {
      if (status) q = q.where('users.status', status);
      if (search) {
        q = q.where(function () {
          this.where('users.displayName', 'like', `%${search}%`)
            .orWhere('users.email', 'like', `%${search}%`);
        });
      }
      filters.forEach(({ field, op, value }) => {
        if (!ALLOWED_FIELDS.has(field) || !VALID_OPS.has(op)) return;
        const col = FIELD_COL[field];
        if (!col) return;
        if (op === 'eq') q = q.where(col, value);
        else if (op === 'neq') q = q.whereNot(col, value);
        else if (op === 'contains') q = q.where(col, 'like', `%${value}%`);
        else if (op === 'startsWith') q = q.where(col, 'like', `${value}%`);
        else if (op === 'isEmpty') q = q.whereNull(col).orWhere(col, '');
      });
      return q;
    }

    let countQuery = db('users')
      .leftJoin('users as manager', 'users.managerId', 'manager.id')
      .leftJoin('users as creator', 'users.createdBy', 'creator.id')
      .leftJoin('users as updater', 'users.updatedBy', 'updater.id')
      .leftJoin('user_roles', 'users.id', 'user_roles.userId')
      .leftJoin('roles', 'user_roles.roleId', 'roles.id');
    countQuery = applyFilters(countQuery);

    let dataQuery = db('users')
      .leftJoin('user_roles', 'users.id', 'user_roles.userId')
      .leftJoin('roles', 'user_roles.roleId', 'roles.id')
      .leftJoin('users as manager', 'users.managerId', 'manager.id')
      .leftJoin('users as creator', 'users.createdBy', 'creator.id')
      .leftJoin('users as updater', 'users.updatedBy', 'updater.id')
      .select(
        'users.id', 'users.email', 'users.displayName', 'users.status',
        'users.mfaEnabled', 'users.createdAt', 'users.updatedAt', 'users.managerId',
        'users.avatarBg', 'users.avatarUrl',
        'manager.displayName as managerName',
        'creator.displayName as createdByName',
        'updater.displayName as updatedByName'
      )
      .select(db.raw("GROUP_CONCAT(roles.name) as roleNames"))
      .groupBy('users.id');
    dataQuery = applyFilters(dataQuery);

    const [countResult] = await countQuery.countDistinct('users.id as total');
    const sortCol = ALLOWED_SORT[sort] || DEFAULT_SORT;
    const sortOrder = ['asc','desc'].includes(order) ? order : 'desc';
    
    let orderByQuery = dataQuery;
    if (sortCol === 'users.displayName') {
      orderByQuery = orderByQuery.orderByRaw(`LOWER(users.displayName) ${sortOrder}`);
    } else if (sortCol === 'users.email') {
      orderByQuery = orderByQuery.orderByRaw(`LOWER(users.email) ${sortOrder}`);
    } else {
      orderByQuery = orderByQuery.orderBy(sortCol, sortOrder);
    }
    const users = await orderByQuery.limit(limit).offset(offset);
    const formatted = users.map(u => ({
      ...u,
      roleNames: u.roleNames ? u.roleNames.split(',') : [],
    }));

    return success({ data: formatted, total: countResult.total || 0, limit, offset });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch users');
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { email, password, displayName, roleIds, managerId } = await request.json();
    const db = getDb();

    if (!email || !password || !displayName) {
      return badRequest('email, password, displayName required');
    }

    const existing = await db('users').where({ email }).first();
    if (existing) {
      return conflict('Email already in use');
    }

    const passwordHash = await hashPassword(password);
    const id = uuidv4();

    const insertData = { id, email, passwordHash, displayName, status: 'active', createdBy: auth.user.id };
    if (managerId) insertData.managerId = managerId;

    await db('users').insert(insertData);

    if (roleIds?.length) {
      await db('user_roles').insert(roleIds.map(roleId => ({ userId: id, roleId })));
    }

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'user',
      entityId: id,
      action: 'created',
      afterData: { email, displayName },
    });

    const user = await db('users').where({ id }).first();
    if (user) {
      delete user.passwordHash;
      delete user.mfaSecret;
      delete user.passwordResetToken;
    }
    return created(user);
  } catch (error) {
    return handleApiError(error, 'Failed to create user');
  }
}
