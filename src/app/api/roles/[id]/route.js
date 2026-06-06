import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { id } = await params;
    const db = getDb();
    const role = await db('roles').where({ id }).first();
    if (!role) return notFound('Role');
    return success(role);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const role = await db('roles').where({ id: (await params).id }).first();
    if (!role) return notFound('Role');

    const { name, description } = await request.json();
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = auth.user.id;

    await db('roles').where({ id: (await params).id }).update(updates);
    await logAudit({
      actorUserId: auth.user.id, entityType: 'role', entityId: (await params).id,
      action: 'updated', beforeData: role, afterData: updates,
    });
    return success({ ...role, ...updates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const role = await db('roles').where({ id: (await params).id }).first();
    if (!role) return notFound('Role');

    await db('roles').where({ id: (await params).id }).del();
    await logAudit({
      actorUserId: auth.user.id, entityType: 'role', entityId: (await params).id,
      action: 'deleted', beforeData: role,
    });
    return success({ message: 'Role deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
