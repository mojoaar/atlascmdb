import { NextResponse } from 'next/server';
import getDb from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../../lib/api-helpers';

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const theme = await db('themes').where({ id: (await params).id }).first();
    if (!theme) return notFound('Theme');

    await db('themes').where({ isDefault: true }).update({ isDefault: false });
    await db('themes').where({ id: (await params).id }).update({ isDefault: true });

    return success({ message: 'Theme activated' });
  } catch (error) {
    return handleApiError(error);
  }
}
