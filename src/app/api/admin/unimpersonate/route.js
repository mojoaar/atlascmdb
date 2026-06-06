import { NextResponse } from 'next/server';
import { extractUserFromRequest, generateAccessToken } from '../../../../lib/auth';
import { handleApiError } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';
import getDb from '../../../../lib/db';

export async function POST(request) {
  try {
    const user = await extractUserFromRequest(request);
    if (!user || !user.impersonatedBy) {
      return NextResponse.json({ error: 'Not currently impersonating' }, { status: 400 });
    }

    const db = getDb();
    const actor = await db('users').where({ id: user.impersonatedBy.id }).first();
    if (!actor) return NextResponse.json({ error: 'Original user not found' }, { status: 404 });

    await logAudit({
      actorUserId: actor.id,
      entityType: 'user',
      entityId: user.id,
      action: 'impersonation_stopped',
      beforeData: { targetUserId: user.id, targetDisplayName: user.displayName },
    });

    const token = generateAccessToken({ id: actor.id, email: actor.email, displayName: actor.displayName });
    const response = NextResponse.json({ success: true });
    response.cookies.set('atlas_access', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });
    return response;
  } catch (error) {
    return handleApiError(error, 'Failed to stop impersonation');
  }
}
