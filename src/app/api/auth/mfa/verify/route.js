import { NextResponse } from 'next/server';
import { verifyAccessToken, generateAccessToken, generateRefreshToken, setTokens, verifyMfaToken } from '../../../../../lib/auth';
import getDb from '../../../../../lib/db';
import { handleApiError } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';
import { enforceRateLimit } from '../../../../../lib/rate-limit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'mfa-verify', { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const { mfaToken, code } = await request.json();

    if (!mfaToken || !code) {
      return NextResponse.json({ error: 'MFA token and code required' }, { status: 400 });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(mfaToken);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired MFA token' }, { status: 401 });
    }

    if (!decoded.mfaPending) {
      return NextResponse.json({ error: 'Invalid MFA token' }, { status: 401 });
    }

    const db = getDb();
    const user = await db('users').where({ id: decoded.sub }).first();

    if (!user || !user.mfaEnabled) {
      return NextResponse.json({ error: 'User not found or MFA not enabled' }, { status: 401 });
    }

    const verified = verifyMfaToken(user.mfaSecret, code);
    if (!verified) {
      return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 });
    }

    await logAudit({
      actorUserId: user.id, entityType: 'user', entityId: user.id,
      action: 'mfa_verified',
    });

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, sessionId } = await generateRefreshToken(user);

    const response = NextResponse.json({
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });

    setTokens(response, accessToken, refreshToken, sessionId);
    return response;
  } catch (error) {
    return handleApiError(error, 'MFA verification failed');
  }
}
