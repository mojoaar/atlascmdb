import { NextResponse } from 'next/server';
import { verifyPassword, generateAccessToken, generateMfaToken, generateRefreshToken, setTokens, verifyMfaToken } from '../../../../lib/auth';
import getDb from '../../../../lib/db';
import { handleApiError } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';
import { enforceRateLimit } from '../../../../lib/rate-limit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'login', { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const { email, password, mfaCode } = await request.json();
    const db = getDb();

    const user = await db('users').where({ email }).first();
    if (!user || user.status !== 'active') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.mfaEnabled) {
      if (!mfaCode) {
        const mfaToken = generateMfaToken(user);
        return NextResponse.json({ mfaRequired: true, mfaToken }, { status: 200 });
      }

      const verified = verifyMfaToken(user.mfaSecret, mfaCode);

      if (!verified) {
        return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 });
      }
    }

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, sessionId } = await generateRefreshToken(user);

    await logAudit({
      actorUserId: user.id,
      entityType: 'user',
      entityId: user.id,
      action: 'login',
    });

    const response = NextResponse.json({
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        mfaEnabled: user.mfaEnabled,
      },
    });

    setTokens(response, accessToken, refreshToken, sessionId);
    return response;
  } catch (error) {
    return handleApiError(error, 'Login failed');
  }
}
