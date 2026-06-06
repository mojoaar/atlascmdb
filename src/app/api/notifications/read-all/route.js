import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, guardResponse } from '../../../../lib/api-helpers';

export async function POST(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    await db('notifications').where({ userId: auth.user.id, read: false }).update({ read: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
