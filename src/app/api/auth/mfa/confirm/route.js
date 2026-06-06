import { NextResponse } from 'next/server';
import { verifyMfaToken, extractUserFromRequest } from '../../../../../lib/auth';
import getDb from '../../../../../lib/db';
import { handleApiError, unauthorized, badRequest, success } from '../../../../../lib/api-helpers';
import { enforceRateLimit } from '../../../../../lib/rate-limit';
import { logAudit } from '../../../../../lib/audit';

export async function POST(request) {
  try {
    const limited = enforceRateLimit(request, 'mfa-confirm', { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const user = await extractUserFromRequest(request);
    if (!user) {
      return unauthorized();
    }

    const { code } = await request.json();
    if (!code) {
      return badRequest('code required');
    }

    const dbUser = await getDb()('users').where({ id: user.id }).first();

    if (!dbUser || !dbUser.mfaSecret) {
      return badRequest('MFA not set up');
    }

    const verified = verifyMfaToken(dbUser.mfaSecret, code);

    if (!verified) {
      return unauthorized('Invalid code');
    }

    await getDb()('users').where({ id: user.id }).update({
      mfaEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    await logAudit({
      actorUserId: user.id,
      entityType: 'user',
      entityId: user.id,
      action: 'mfa_enabled',
      beforeData: null,
      afterData: { mfaEnabled: true },
    });

    return success({ mfaEnabled: true });
  } catch (error) {
    return handleApiError(error, 'MFA confirm failed');
  }
}
