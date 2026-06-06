import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../lib/db';
import { handleApiError } from '../../../../lib/api-helpers';
import { enforceRateLimit } from '../../../../lib/rate-limit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'forgot-password', { limit: 5, windowMs: 60_000 });
    if (limited) return limited;

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const db = getDb();
    const user = await db('users').where({ email }).first();

    if (!user) {
      return NextResponse.json({ message: 'If the account exists, a reset link has been sent.' });
    }

    const resetToken = uuidv4();
    await db('users').where({ id: user.id }).update({
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 3600000).toISOString(),
    });

    return NextResponse.json({ message: 'If the account exists, a reset link has been sent.' });
  } catch (error) {
    return handleApiError(error, 'Request failed');
  }
}
