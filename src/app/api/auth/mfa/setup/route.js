import { NextResponse } from 'next/server';
import { generateMfaSecret, extractUserFromRequest } from '../../../../../lib/auth';
import getDb from '../../../../../lib/db';
import { handleApiError } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

export async function POST(request) {
  try {
    const user = await extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const secret = generateMfaSecret(user.email);
    const db = getDb();

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

    const { enabled } = await request.json();
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled field required (boolean)' }, { status: 400 });
    }

    const db = getDb();
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
