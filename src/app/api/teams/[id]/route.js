import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const team = await db('teams')
      .leftJoin('teams as parent', 'teams.parentTeamId', 'parent.id')
      .leftJoin('roles', 'teams.roleId', 'roles.id')
      .select('teams.*', 'parent.name as parentTeamName', 'roles.name as roleName')
      .where('teams.id', (await params).id)
      .first();

    if (!team) return notFound('Team');

    const members = await db('team_members')
      .join('users', 'team_members.userId', 'users.id')
      .where('team_members.teamId', (await params).id)
      .select('team_members.id as membershipId', 'team_members.memberRole', 'users.id', 'users.email', 'users.displayName');

    return success({ ...team, members });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const team = await db('teams').where({ id: (await params).id }).first();
    if (!team) return notFound('Team');

    const body = await request.json();
    if (body.roleId !== undefined && body.roleId !== team.roleId && auth.effectiveRole !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can assign or modify team roles' }, { status: 403 });
    }

    const updates = {};
    const fields = ['name', 'description', 'type', 'parentTeamId', 'ownershipScope', 'status', 'roleId', 'managerId', 'leadId'];
    fields.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });

    if (Object.keys(updates).length) {
      updates.updatedAt = new Date().toISOString();
      updates.updatedBy = auth.user.id;
      await db('teams').where({ id: (await params).id }).update(updates);
    }

    await logAudit({
      actorUserId: auth.user.id, entityType: 'team', entityId: (await params).id,
      action: 'updated', beforeData: team, afterData: updates,
    });

    const updated = await db('teams').where({ id: (await params).id }).first();
    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const team = await db('teams').where({ id: (await params).id }).first();
    if (!team) return notFound('Team');

    await db('teams').where({ id: (await params).id }).del();

    await logAudit({
      actorUserId: auth.user.id, entityType: 'team', entityId: (await params).id,
      action: 'deleted', beforeData: team,
    });

    return success({ message: 'Team deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
