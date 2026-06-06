import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { handleApiError, success } from '../../../../lib/api-helpers';

export async function GET() {
  try {
    const db = getDb();
    const row = await db('app_config').where({ key: 'login_ascii_logo' }).first();
    const login_ascii_logo = row ? row.value : 'false';
    return success({ login_ascii_logo });
  } catch (error) {
    return handleApiError(error, 'ConfigPublic');
  }
}
