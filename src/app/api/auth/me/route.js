import { NextResponse } from 'next/server';
import { extractUserFromRequest } from '../../../../lib/auth';
import getDb from '../../../../lib/db';
import { unauthorized, handleApiError, success } from '../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const user = await extractUserFromRequest(request);
    if (!user) {
      return unauthorized();
    }

    const db = getDb();
    const fresh = await db('users').where({ id: user.targetUserId || user.id }).first();

    const prefs = await db('user_theme_preferences')
      .where({ userId: user.id })
      .first();

    return success({
      id: fresh.id,
      email: fresh.email,
      displayName: fresh.displayName,
      roles: user.roles,
      teams: user.teams,
      mfaEnabled: fresh.mfaEnabled,
      avatarUrl: fresh.avatarUrl || null,
      avatarBg: fresh.avatarBg || '#003d7a',
      timezone: prefs?.timezone || 'Europe/Copenhagen',
      clockFormat: prefs?.clockFormat || '24h',
      dateFormat: prefs?.dateFormat || 'DD/MM/YYYY',
      graphDepth: prefs?.graphDepth || 3,
      columnPrefs: prefs?.columnPrefs ? JSON.parse(prefs.columnPrefs) : {},
      impersonatedBy: user.impersonatedBy || null,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get user info');
  }
}
