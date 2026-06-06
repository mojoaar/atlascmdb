import { NextResponse } from 'next/server';
import getDb from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/rbac';
import { handleApiError } from '../../../../../lib/api-helpers';

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { id } = await params;
    const db = getDb();
    const n = await db('notifications').where({ id, userId: auth.user.id }).first();
    if (!n) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db('notifications').where({ id }).update({ read: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
