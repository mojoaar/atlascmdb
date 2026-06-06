import { NextResponse } from 'next/server';
import { verifyMfaToken, extractUserFromRequest } from '../../../../../lib/auth';
import getDb from '../../../../../lib/db';
import { handleApiError } from '../../../../../lib/api-helpers';
import { enforceRateLimit } from '../../../../../lib/rate-limit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'mfa-confirm', { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const user = await extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'code required' }, { status: 400 });
    }

    const dbUser = await getDb()('users').where({ id: user.id }).first();

    if (!dbUser || !dbUser.mfaSecret) {
      return NextResponse.json({ error: 'MFA not set up' }, { status: 400 });
    }

    const verified = verifyMfaToken(dbUser.mfaSecret, code);

    if (!verified) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }

    await getDb()('users').where({ id: user.id }).update({
      mfaEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ mfaEnabled: true });
  } catch (error) {
    return handleApiError(error, 'MFA confirm failed');
  }
}
