import { NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/auth';
import getDb from '../../../../lib/db';
import { handleApiError } from '../../../../lib/api-helpers';
import { enforceRateLimit } from '../../../../lib/rate-limit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'reset-password', { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = getDb();
    const user = await db('users')
      .where('passwordResetToken', token)
      .where('passwordResetExpires', '>', new Date().toISOString())
      .first();

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
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

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    return handleApiError(error, 'Password reset failed');
  }
}
