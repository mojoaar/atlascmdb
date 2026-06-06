import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError } from '../../../../lib/api-helpers';

export async function POST(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    await db('notifications').where({ userId: auth.user.id, read: false }).update({ read: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
