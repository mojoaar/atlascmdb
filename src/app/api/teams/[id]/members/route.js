import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../../lib/rbac';
import { handleApiError, success, created } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const members = await db('team_members')
      .join('users', 'team_members.userId', 'users.id')
      .where('team_members.teamId', (await params).id)
      .select('team_members.id as membershipId', 'team_members.memberRole', 'users.id', 'users.email', 'users.displayName');

    return success(members);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const team = await db('teams').where({ id: (await params).id }).first();
    if (!team) return notFound('Team');

    if (team.roleId !== null && auth.effectiveRole !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can modify membership on role-bearing teams' }, { status: 403 });
    }

    const { userId, memberRole } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const existing = await db('team_members').where({ teamId: (await params).id, userId }).first();
    if (existing) return NextResponse.json({ error: 'Member already in team' }, { status: 409 });

    const id = uuidv4();
    await db('team_members').insert({ id, teamId: (await params).id, userId, memberRole: memberRole || 'Member' });

    await logAudit({
      actorUserId: auth.user.id, entityType: 'team', entityId: (await params).id,
      action: 'member_added', afterData: { userId, memberRole: memberRole || 'Member' },
    });

    return created({ id, teamId: (await params).id, userId, memberRole: memberRole || 'Member' });
  } catch (error) {
    return handleApiError(error);
  }
}
