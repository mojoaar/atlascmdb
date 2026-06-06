import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../lib/db';
import { handleApiError, badRequest, success } from '../../../../lib/api-helpers';
import { enforceRateLimit } from '../../../../lib/rate-limit';
import { logAudit } from '../../../../lib/audit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'forgot-password', { limit: 5, windowMs: 60_000 });
    if (limited) return limited;

    const { email } = await request.json();

    if (!email) {
      return badRequest('Email required');
    }

    const db = getDb();
    const user = await db('users').where({ email }).first();

    if (!user) {
      return success({ message: 'If the account exists, a reset link has been sent.' });
    }

    const resetToken = uuidv4();
    await db('users').where({ id: user.id }).update({
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 3600000).toISOString(),
    });

    await logAudit({
      actorUserId: user.id,
      entityType: 'user',
      entityId: user.id,
      action: 'password_reset_requested',
      beforeData: null,
      afterData: { message: 'Password reset token generated' },
    });

    return success({ message: 'If the account exists, a reset link has been sent.' });
  } catch (error) {
    return handleApiError(error, 'Request failed');
  }
}
