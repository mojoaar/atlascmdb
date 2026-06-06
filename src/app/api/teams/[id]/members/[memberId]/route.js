import { NextResponse } from 'next/server';
import getDb from '../../../../../../lib/db';
import { requireEditor } from '../../../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../../../lib/api-helpers';
import { logAudit } from '../../../../../../lib/audit';

export async function DELETE(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const member = await db('team_members').where({ id: (await params).memberId, teamId: (await params).id }).first();
    if (!member) return notFound('Member');

    await logAudit({
      actorUserId: auth.user.id, entityType: 'team', entityId: (await params).id,
      action: 'member_removed', beforeData: member,
    });
    await db('team_members').where({ id: (await params).memberId }).del();
    return success({ message: 'Member removed from team' });
  } catch (error) {
    return handleApiError(error);
  }
}
