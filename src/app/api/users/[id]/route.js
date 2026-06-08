import getDb from '../../../../lib/db';
import { requireAuth, requireAdmin } from '../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse, badRequest } from '../../../../lib/api-helpers';
import { hashPassword, verifyPassword } from '../../../../lib/auth';
import { logAudit } from '../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    const user = await db('users')
      .leftJoin('users as manager', 'users.managerId', 'manager.id')
      .select('users.*', 'manager.displayName as managerName')
      .where('users.id', id)
      .first();

    if (!user) return notFound('User');

    const roles = await db('user_roles')
      .join('roles', 'user_roles.roleId', 'roles.id')
      .where('user_roles.userId', user.id)
      .select('roles.id', 'roles.name');

    const teams = await db('team_members')
      .join('teams', 'team_members.teamId', 'teams.id')
      .where('team_members.userId', user.id)
      .select('teams.id', 'teams.name', 'team_members.memberRole');

    if (user) {
      delete user.passwordHash;
      delete user.mfaSecret;
      delete user.passwordResetToken;
      delete user.passwordResetExpires;
    }

    return success({ ...user, roles, teams });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch user');
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    const user = await db('users').where({ id }).first();
    if (!user) return notFound('User');

    const isSelf = auth.user.id === id || auth.user.targetUserId === id;
    const isAdmin = auth.effectiveRole === 'admin';

    const body = await request.json();
    const updates = {};

    if (isAdmin && body.displayName !== undefined) updates.displayName = body.displayName;
    if (isAdmin && body.email !== undefined) updates.email = body.email;
    if (isAdmin && body.status !== undefined) updates.status = body.status;
    
    if (body.password !== undefined && (isAdmin || isSelf)) {
      if (body.password.length < 8) {
        return badRequest('Password must be at least 8 characters');
      }
      if (isSelf && !isAdmin) {
        if (!body.currentPassword) {
          return badRequest('Current password required to change password');
        }
        const isValid = await verifyPassword(body.currentPassword, user.passwordHash);
        if (!isValid) {
          return badRequest('Invalid current password');
        }
      }
      updates.passwordHash = await hashPassword(body.password);
    }
    
    if ((isAdmin || isSelf) && body.mfaEnabled !== undefined) {
      if (body.mfaEnabled === true) {
        updates.mfaEnabled = true;
      }
    }
    
    if (isAdmin && body.managerId !== undefined) updates.managerId = body.managerId || null;
    if ((isAdmin || isSelf) && body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl || null;
    if ((isAdmin || isSelf) && body.avatarBg !== undefined) updates.avatarBg = body.avatarBg;

    if (Object.keys(updates).length) {
      updates.updatedAt = new Date().toISOString();
      updates.updatedBy = auth.user.id;
      await db('users').where({ id }).update(updates);
      if (updates.passwordHash) {
        await db('sessions').where({ userId: id }).del();
      }
    }

    let roleChange;
    if (isAdmin && body.roleIds) {
      const before = await db('user_roles').where({ userId: id }).pluck('roleId');
      await db('user_roles').where({ userId: id }).del();
      if (body.roleIds.length) {
        await db('user_roles').insert(body.roleIds.map(roleId => ({ userId: id, roleId })));
      }
      roleChange = { before, after: body.roleIds };
    }

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'user', entityId: id, action: 'updated',
      beforeData: { email: user.email, displayName: user.displayName, ...(roleChange && { roleIds: roleChange.before }) },
      afterData: { ...updates, ...(updates.updatedBy && { updatedBy: auth.user.displayName || auth.user.email }), ...(roleChange && { roleIds: roleChange.after }) },
    });

    const updated = await db('users').where({ id }).first();
    if (updated) {
      delete updated.passwordHash;
      delete updated.mfaSecret;
      delete updated.passwordResetToken;
    }
    return success(updated);
  } catch (error) {
    return handleApiError(error, 'Failed to update user');
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    const user = await db('users').where({ id }).first();
    if (!user) return notFound('User');

    await db('users').where({ id }).update({ status: 'disabled', updatedAt: new Date().toISOString() });

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'user', entityId: id, action: 'deleted',
      beforeData: { email: user.email },
    });

    return success({ message: 'User disabled' });
  } catch (error) {
    return handleApiError(error, 'Failed to delete user');
  }
}
