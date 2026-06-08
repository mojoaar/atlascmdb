import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth, requireAdmin } from '../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const theme = await db('themes').where({ id: (await params).id }).first();
    if (!theme) return notFound('Theme');

    if (typeof theme.tokenSet === 'string') {
      theme.tokenSet = JSON.parse(theme.tokenSet);
    }

    return success(theme);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const theme = await db('themes').where({ id: (await params).id }).first();
    if (!theme) return notFound('Theme');

    const body = await request.json();
    const updates = {};
    const genFields = ['name', 'isDefault', 'isSystem', 'status'];
    genFields.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });

    if (body.tokenSetLight !== undefined) {
      updates.tokenSetLight = typeof body.tokenSetLight === 'string' ? body.tokenSetLight : JSON.stringify(body.tokenSetLight);
    }
    if (body.tokenSetDark !== undefined) {
      updates.tokenSetDark = typeof body.tokenSetDark === 'string' ? body.tokenSetDark : JSON.stringify(body.tokenSetDark);
    }

    if (Object.keys(updates).length) {
      updates.updatedAt = new Date().toISOString();
      updates.updatedBy = auth.user.id;
      await db('themes').where({ id: (await params).id }).update(updates);
    }

    await logAudit({
      actorUserId: auth.user.id, entityType: 'theme', entityId: (await params).id,
      action: 'updated', beforeData: theme, afterData: { ...updates, ...(updates.updatedBy && { updatedBy: auth.user.displayName || auth.user.email }) },
    });

    const updated = await db('themes').where({ id: (await params).id }).first();
    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const theme = await db('themes').where({ id: (await params).id }).first();
    if (!theme) return notFound('Theme');

    if (theme.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system themes' }, { status: 400 });
    }

    await logAudit({
      actorUserId: auth.user.id, entityType: 'theme', entityId: (await params).id,
      action: 'deleted', beforeData: theme,
    });
    await db('themes').where({ id: (await params).id }).del();
    return success({ message: 'Theme deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
