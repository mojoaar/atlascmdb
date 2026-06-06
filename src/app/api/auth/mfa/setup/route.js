import { NextResponse } from 'next/server';
import { generateMfaSecret, extractUserFromRequest, verifyMfaToken } from '../../../../../lib/auth';
import getDb from '../../../../../lib/db';
import { handleApiError } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

export async function POST(request) {
  try {
    const user = await extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();
    const dbUser = await db('users').where({ id: user.id }).first();
    if (dbUser && dbUser.mfaEnabled) {
      let code;
      try {
        const body = await request.json();
        code = body?.code;
      } catch {
        return NextResponse.json({ error: 'MFA code is required' }, { status: 400 });
      }
      if (!code || !verifyMfaToken(dbUser.mfaSecret, code)) {
        return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 });
      }
    }

    const secret = generateMfaSecret(user.email);

    await db('users').where({ id: user.id }).update({
      mfaSecret: secret.base32,
      mfaEnabled: false,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    });
  } catch (error) {
    return handleApiError(error, 'MFA setup failed');
  }
}

export async function PUT(request) {
  try {
    const user = await extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { enabled, code } = await request.json();
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled field required (boolean)' }, { status: 400 });
    }

    const db = getDb();
    const dbUser = await db('users').where({ id: user.id }).first();
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (enabled === false && dbUser.mfaEnabled) {
      if (!code || !verifyMfaToken(dbUser.mfaSecret, code)) {
        return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 });
      }
    }

    await db('users').where({ id: user.id }).update({
      mfaEnabled: enabled,
      updatedAt: new Date().toISOString(),
    });

    await logAudit({
      actorUserId: user.id, entityType: 'user', entityId: user.id,
      action: enabled ? 'mfa_enabled' : 'mfa_disabled',
    });

    return NextResponse.json({ mfaEnabled: enabled });
  } catch (error) {
    return handleApiError(error, 'MFA toggle failed');
  }
}
