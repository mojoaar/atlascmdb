import { NextResponse } from 'next/server';
import getDb from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/rbac';
import { handleApiError, success } from '../../../../../../lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { type, id } = await params;
    const db = getDb();
    const relationships = await db('relationships')
      .where(function () {
        this.where('sourceType', type).where('sourceId', id)
          .orWhere('targetType', type).where('targetId', id);
      });

    return success(relationships);
  } catch (error) {
    return handleApiError(error);
  }
}
