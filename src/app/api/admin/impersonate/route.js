import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/rbac';
import { generateImpersonationToken } from '../../../../lib/auth';
import { handleApiError, guardResponse } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';
import getDb from '../../../../lib/db';

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const db = getDb();
    const target = await db('users').where({ id: userId }).first();
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (target.id === auth.user.id) {
      return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 });
    }

    const token = generateImpersonationToken(auth.user, target);

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'user',
      entityId: target.id,
      action: 'impersonation_started',
      afterData: { targetUserId: target.id, targetDisplayName: target.displayName },
    });

    const response = NextResponse.json({ success: true, displayName: target.displayName });
    response.cookies.set('atlas_access', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });
    return response;
  } catch (error) {
    return handleApiError(error, 'Failed to impersonate');
  }
}
