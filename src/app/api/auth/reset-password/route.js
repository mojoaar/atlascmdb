import { NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/auth';
import getDb from '../../../../lib/db';
import { handleApiError, badRequest, success } from '../../../../lib/api-helpers';
import { enforceRateLimit } from '../../../../lib/rate-limit';
import { logAudit } from '../../../../lib/audit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'reset-password', { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const { token, password } = await request.json();

    if (!token || !password) {
      return badRequest('Token and password required');
    }

    if (password.length < 8) {
      return badRequest('Password must be at least 8 characters');
    }

    const db = getDb();
    const user = await db('users')
      .where('passwordResetToken', token)
      .where('passwordResetExpires', '>', new Date().toISOString())
      .first();

    if (!user) {
      return badRequest('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(password);

    await db('users').where({ id: user.id }).update({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date().toISOString(),
    });

    // Invalidate all existing sessions so any tokens issued before the reset
    // (e.g. to an attacker) can no longer be refreshed.
    await db('sessions').where({ userId: user.id }).del();

    await logAudit({
      actorUserId: user.id,
      entityType: 'user',
      entityId: user.id,
      action: 'password_reset_completed',
      beforeData: null,
      afterData: { message: 'Password updated and sessions invalidated' },
    });

    return success({ message: 'Password reset successful' });
  } catch (error) {
    return handleApiError(error, 'Password reset failed');
  }
}
