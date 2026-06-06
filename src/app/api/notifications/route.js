import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAuth, requireAdmin } from '../../../lib/rbac';
import { handleApiError, created, badRequest, guardResponse } from '../../../lib/api-helpers';

const VALID_TYPES = new Set(['info', 'warning', 'success', 'error']);

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const unread = searchParams.get('unread');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db('notifications').where({ userId: auth.user.id });
    if (unread === '1') query = query.where({ read: false });

    const [countResult] = await query.clone().count('* as total');
    const rows = await query.orderBy('createdAt', 'desc').limit(limit).offset(offset);

    return NextResponse.json({ data: rows, total: countResult.total, limit, offset });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    // Notifications are normally system-generated (see lib/audit.js). The public
    // POST endpoint is admin-only to prevent any authenticated user from planting
    // arbitrary notifications in another user's feed (phishing/spoofing).
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { userId, type, title, body, entityType, entityId } = await request.json();
    if (!userId || !title) return badRequest('userId and title required');
    if (type && !VALID_TYPES.has(type)) return badRequest(`Invalid type: ${type}`);

    const db = getDb();
    const id = uuidv4();
    await db('notifications').insert({
      id, userId, type: type || 'info', title, body: body || '',
      entityType: entityType || null, entityId: entityId || null, read: false,
    });

    return created({ id, title });
  } catch (error) {
    return handleApiError(error);
  }
}
