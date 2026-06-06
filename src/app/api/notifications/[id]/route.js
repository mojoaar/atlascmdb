import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, success, notFound } from '../../../../lib/api-helpers';

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { id } = await params;
    const db = getDb();
    const n = await db('notifications').where({ id, userId: auth.user.id }).first();
    if (!n) return notFound('Notification');

    await db('notifications').where({ id }).del();
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
