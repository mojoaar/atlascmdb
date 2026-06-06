import { NextResponse } from 'next/server';
import { clearTokens, extractUserFromRequest } from '../../../../lib/auth';
import getDb from '../../../../lib/db';
import { logAudit } from '../../../../lib/audit';

export async function POST(request) {
  try {
    const user = await extractUserFromRequest(request);
    const cookieStore = await request.cookies;
    const bodySessionId = (await request.json().catch(() => ({}))).sessionId;
    const sessionId = bodySessionId || cookieStore.get('atlas_session')?.value;

    if (sessionId) {
      const db = getDb();
      await db('sessions').where({ id: sessionId }).del();
    }

    if (user) {
      await logAudit({
        actorUserId: user.id,
        entityType: 'user',
        entityId: user.id,
        action: 'logout',
      });
    }

    const response = NextResponse.json({ success: true });
    clearTokens(response);
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    clearTokens(response);
    return response;
  }
}
