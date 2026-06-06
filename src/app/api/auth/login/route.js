import { NextResponse } from 'next/server';
import { verifyPassword, generateAccessToken, generateMfaToken, generateRefreshToken, setTokens, verifyMfaToken } from '../../../../lib/auth';
import getDb from '../../../../lib/db';
import { handleApiError } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';
import { enforceRateLimit, failedLoginLimiter } from '../../../../lib/rate-limit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'login', { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const { email, password, mfaCode } = await request.json();

    if (email) {
      const lockoutCheck = failedLoginLimiter(email, { checkOnly: true });
      if (!lockoutCheck.allowed) {
        return NextResponse.json(
          { error: 'Too many failed login attempts. This account is temporarily locked.' },
          { status: 429, headers: { 'Retry-After': String(lockoutCheck.retryAfter) } }
        );
      }
    }

    const db = getDb();

    const user = await db('users').where({ email }).first();
    if (!user || user.status !== 'active') {
      failedLoginLimiter(email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      failedLoginLimiter(email);
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
