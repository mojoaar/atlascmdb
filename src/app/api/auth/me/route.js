import { NextResponse } from 'next/server';
import { extractUserFromRequest } from '../../../../lib/auth';
import getDb from '../../../../lib/db';

export async function GET(request) {
  try {
    const user = await extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();
    const fresh = await db('users').where({ id: user.targetUserId || user.id }).first();

    const prefs = await db('user_theme_preferences')
      .where({ userId: user.id })
      .first();

    return NextResponse.json({
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
  } catch {
    return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
  }
}
