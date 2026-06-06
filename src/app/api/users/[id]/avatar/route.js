import { NextResponse } from 'next/server';
import getDb from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/rbac';
import { handleApiError, guardResponse, forbidden, badRequest, success } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

const MAX_SIZE = 2 * 1024 * 1024;
const EXT_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };

function getMimeType(file) {
  if (file.type && /^image\/(jpeg|png|gif|webp)$/.test(file.type)) return file.type;
  const ext = file.name.split('.').pop().toLowerCase();
  return EXT_TYPES[ext] || null;
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const db = getDb();
    const user = await db('users').where({ id }).select('avatarData', 'avatarMimeType').first();
    if (!user || !user.avatarData) return new NextResponse('Not found', { status: 404 });

    return new NextResponse(user.avatarData, {
      status: 200,
      headers: {
        'Content-Type': user.avatarMimeType || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch avatar');
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const isSelf = auth.user.id === id || auth.user.targetUserId === id;
    if (!isSelf) return forbidden();

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return badRequest('No file provided');

    const mimeType = getMimeType(file);
    if (!mimeType) {
      return badRequest('Only JPEG, PNG, GIF, and WebP images are allowed');
    }
    if (file.size > MAX_SIZE) {
      return badRequest('Avatar must be under 2 MB');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const db = getDb();

    await db('users').where({ id }).update({
      avatarData: buffer,
      avatarMimeType: mimeType,
      avatarUrl: `/api/users/${id}/avatar`,
    });

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'user',
      entityId: id,
      action: 'avatar_updated',
      afterData: { mimeType, size: buffer.length },
    });

    return success({ url: `/api/users/${id}/avatar` });
  } catch (error) {
    return handleApiError(error, 'Avatar upload failed');
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id } = await params;
    const isSelf = auth.user.id === id || auth.user.targetUserId === id;
    if (!isSelf) return forbidden();

    const db = getDb();
    await db('users').where({ id }).update({ avatarData: null, avatarMimeType: null, avatarUrl: null });

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'user',
      entityId: id,
      action: 'avatar_deleted',
    });

    return success({ message: 'Avatar removed' });
  } catch (error) {
    return handleApiError(error, 'Failed to remove avatar');
  }
}
