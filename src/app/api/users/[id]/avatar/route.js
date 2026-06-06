import { NextResponse } from 'next/server';
import getDb from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/rbac';
import { handleApiError } from '../../../../../lib/api-helpers';

const MAX_SIZE = 2 * 1024 * 1024;
const EXT_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };

function getMimeType(file) {
  if (file.type && /^image\/(jpeg|png|gif|webp)$/.test(file.type)) return file.type;
  const ext = file.name.split('.').pop().toLowerCase();
  return EXT_TYPES[ext] || null;
}

export async function GET(request, { params }) {
  try {
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
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { id } = await params;
    const isSelf = auth.user.id === id || auth.user.targetUserId === id;
    if (!isSelf) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const mimeType = getMimeType(file);
    if (!mimeType) {
      return NextResponse.json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Avatar must be under 2 MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const db = getDb();

    await db('users').where({ id }).update({
      avatarData: buffer,
      avatarMimeType: mimeType,
      avatarUrl: `/api/users/${id}/avatar`,
    });

    return NextResponse.json({ url: `/api/users/${id}/avatar` });
  } catch (error) {
    return handleApiError(error, 'Avatar upload failed');
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { id } = await params;
    const isSelf = auth.user.id === id || auth.user.targetUserId === id;
    if (!isSelf) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getDb();
    await db('users').where({ id }).update({ avatarData: null, avatarMimeType: null, avatarUrl: null });

    return NextResponse.json({ message: 'Avatar removed' });
  } catch (error) {
    return handleApiError(error, 'Failed to remove avatar');
  }
}
