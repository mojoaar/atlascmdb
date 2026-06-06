import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../../lib/rbac';
import { handleApiError, success, created, guardResponse } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const attachments = await db('asset_attachments')
      .where({ assetId: (await params).id })
      .select('id', 'filename', 'mimeType', 'size', 'createdAt')
      .orderBy('createdAt', 'desc');

    return success(attachments);
  } catch (error) {
    return handleApiError(error);
  }
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Attachment must be under 10 MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const db = getDb();

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const config = await db('app_config').where({ key: 'attachment_allowed_types' }).first();
    const allowed = config?.value ? config.value.split(',').map(s => s.trim().toLowerCase()) : ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: `File type ${ext} is not allowed` }, { status: 400 });
    }

    const id = uuidv4();

    await db('asset_attachments').insert({
      id,
      assetId: (await params).id,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: buffer.length,
      data: buffer,
    });

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'asset',
      entityId: (await params).id,
      action: 'attachment_added',
      afterData: { attachmentId: id, filename: file.name, size: buffer.length },
    });

    return created({ id, filename: file.name, size: buffer.length });
  } catch (error) {
    return handleApiError(error, 'Upload failed');
  }
}
