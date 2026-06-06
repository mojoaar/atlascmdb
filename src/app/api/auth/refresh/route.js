import { NextResponse } from 'next/server';
import { rotateRefreshToken, generateAccessToken, setTokens, clearTokens, verifyRefreshToken } from '../../../../lib/auth';
import getDb from '../../../../lib/db';
import { handleApiError } from '../../../../lib/api-helpers';

export async function POST(request) {
  try {
    let refreshToken, sessionId;

    const body = await request.json().catch(() => null);
    if (body?.refreshToken) {
      refreshToken = body.refreshToken;
      sessionId = body.sessionId;
    } else {
      const cookieStore = await request.cookies;
      const cookie = cookieStore.get('atlas_refresh');
      if (cookie) {
        refreshToken = cookie.value;
        sessionId = cookieStore.get('atlas_session')?.value;
      }
    }

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 401 });
    }

    try {
      verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // A non-revoked session is mandatory. This is what makes logout / revocation
    // actually effective — a stolen refresh token without a live session is useless.
    if (!sessionId) {
      return NextResponse.json({ error: 'Session required' }, { status: 401 });
    }

    const result = await rotateRefreshToken(refreshToken, sessionId);
    if (!result) {
      return NextResponse.json({ error: 'Token rotation failed' }, { status: 401 });
    }

    const db = getDb();
    const session = await db('sessions').where({ id: result.sessionId }).first();
    const user = session ? await db('users').where({ id: session.userId }).first() : null;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const accessToken = generateAccessToken(user);
    const response = NextResponse.json({
      accessToken,
      refreshToken: result.token,
      sessionId: result.sessionId,
    });

    setTokens(response, accessToken, result.token, result.sessionId);
    return response;
  } catch (error) {
    return handleApiError(error, 'Token refresh failed');
  }
}
