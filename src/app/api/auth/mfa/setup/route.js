import { NextResponse } from 'next/server';
import { generateMfaSecret, extractUserFromRequest, verifyMfaToken } from '../../../../../lib/auth';
import getDb from '../../../../../lib/db';
import { handleApiError, unauthorized, badRequest, notFound, success } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';
import QRCode from 'qrcode';

export async function POST(request) {
  try {
    const user = await extractUserFromRequest(request);
    if (!user) {
      return unauthorized();
    }

    const db = getDb();
    const dbUser = await db('users').where({ id: user.id }).first();
    if (dbUser && dbUser.mfaEnabled) {
      let code;
      try {
        const body = await request.json();
        code = body?.code;
      } catch {
        return badRequest('MFA code is required');
      }
      if (!code || !verifyMfaToken(dbUser.mfaSecret, code)) {
        return unauthorized('Invalid MFA code');
      }
    }

    const secret = generateMfaSecret(user.email);
    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(secret.otpauth_url);
    } catch (err) {
      console.error('Failed to generate local QR code', err);
    }

    await db('users').where({ id: user.id }).update({
      mfaSecret: secret.base32,
      mfaEnabled: false,
      updatedAt: new Date().toISOString(),
    });

    await logAudit({
      actorUserId: user.id,
      entityType: 'user',
      entityId: user.id,
      action: 'mfa_setup_initiated',
      beforeData: null,
      afterData: { message: 'MFA setup initiated' },
    });

    return success({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode,
    });
  } catch (error) {
    return handleApiError(error, 'MFA setup failed');
  }
}

export async function PUT(request) {
  try {
    const user = await extractUserFromRequest(request);
    if (!user) {
      return unauthorized();
    }

    const { enabled, code } = await request.json();
    if (typeof enabled !== 'boolean') {
      return badRequest('enabled field required (boolean)');
    }

    const db = getDb();
    const dbUser = await db('users').where({ id: user.id }).first();
    if (!dbUser) {
      return notFound('User');
    }

    if (enabled === false && dbUser.mfaEnabled) {
      if (!code || !verifyMfaToken(dbUser.mfaSecret, code)) {
        return unauthorized('Invalid MFA code');
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

    return success({ mfaEnabled: enabled });
  } catch (error) {
    return handleApiError(error, 'MFA toggle failed');
  }
}
