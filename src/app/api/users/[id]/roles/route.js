import { NextResponse } from 'next/server';
import getDb from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/rbac';
import { handleApiError, success, guardResponse } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

export async function PUT(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const { roleIds } = await request.json();
    if (!roleIds || !Array.isArray(roleIds)) {
      return NextResponse.json({ error: 'roleIds array required' }, { status: 400 });
    }

    const db = getDb();
    const user = await db('users').where({ id }).first();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await db('user_roles').where({ userId: id }).del();
    if (roleIds.length) {
      await db('user_roles').insert(roleIds.map(roleId => ({ userId: id, roleId })));
    }

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'user', entityId: id, action: 'roles_updated',
    });

    return success({ message: 'Roles updated' });
  } catch (error) {
    return handleApiError(error, 'Failed to update roles');
  }
}
