import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const row = await db('assets')
      .leftJoin('ci_base', 'assets.ciId', 'ci_base.id')
      .leftJoin('locations', 'assets.locationId', 'locations.id')
      .leftJoin('users', 'assets.assignedTo', 'users.id')
      .select(
        'assets.*',
        'ci_base.name as ciName',
        'locations.name as locationName',
        'users.displayName as assignedToName'
      )
      .where('assets.id', (await params).id)
      .first();

    if (!row) return notFound('Asset');

    return success({
      id: row.id, name: row.name, assetTag: row.assetTag, ciId: row.ciId,
      ciName: row.ciName, category: row.category, model: row.model,
      status: row.status, assignedTo: row.assignedTo, assignedToName: row.assignedToName,
      locationId: row.locationId, locationName: row.locationName,
      supplier: row.supplier, purchaseDate: row.purchaseDate,
      warrantyExpiry: row.warrantyExpiry, cost: row.cost,
      notes: row.notes, createdAt: row.createdAt, updatedAt: row.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const existing = await db('assets').where({ id: (await params).id }).first();
    if (!existing) return notFound('Asset');

    const body = await request.json();
    const updates = {};
    const fields = ['name', 'assetTag', 'ciId', 'category', 'model', 'status', 'assignedTo', 'locationId', 'supplier', 'purchaseDate', 'warrantyExpiry', 'cost', 'notes'];
    fields.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });
    if (updates.ciId === '') updates.ciId = null;
    if (updates.assignedTo === '') updates.assignedTo = null;
    if (updates.locationId === '') updates.locationId = null;

    if (Object.keys(updates).length) {
      updates.updatedAt = new Date().toISOString();
      updates.updatedBy = auth.user.id;
      await db('assets').where({ id: (await params).id }).update(updates);
    }

    await logAudit({
      actorUserId: auth.user.id, entityType: 'asset', entityId: (await params).id,
      action: 'updated', beforeData: existing, afterData: updates,
    });

    const updated = await db('assets').where({ id: (await params).id }).first();
    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const asset = await db('assets').where({ id: (await params).id }).first();
    if (!asset) return notFound('Asset');

    await db('assets').where({ id: (await params).id }).del();

    await logAudit({
      actorUserId: auth.user.id, entityType: 'asset', entityId: (await params).id,
      action: 'deleted', beforeData: asset,
    });

    return success({ message: 'Asset deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
