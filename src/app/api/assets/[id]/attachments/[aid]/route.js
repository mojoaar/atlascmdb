import getDb from '../../../../../../lib/db';
import { requireEditor } from '../../../../../../lib/rbac';
import { handleApiError, success, notFound, guardResponse } from '../../../../../../lib/api-helpers';
import { logAudit } from '../../../../../../lib/audit';

export async function DELETE(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const attachment = await db('asset_attachments').where({ id: (await params).aid }).first();
    if (!attachment) return notFound('Attachment');

    await logAudit({
      actorUserId: auth.user.id,
      entityType: 'asset',
      entityId: attachment.assetId,
      action: 'attachment_removed',
      beforeData: { attachmentId: attachment.id, filename: attachment.filename, size: attachment.size },
    });

    await db('asset_attachments').where({ id: (await params).aid }).del();
    return success({ message: 'Attachment deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
