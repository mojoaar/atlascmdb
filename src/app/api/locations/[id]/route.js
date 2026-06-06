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
    const location = await db('locations')
      .leftJoin('locations as parent', 'locations.parentLocationId', 'parent.id')
      .select('locations.*', 'parent.name as parentLocationName')
      .where('locations.id', (await params).id)
      .first();

    if (!location) return notFound('Location');

    const children = await db('locations').where({ parentLocationId: (await params).id }).select('id', 'name', 'type');
    const cis = await db('ci_base').where({ locationId: (await params).id }).select('id', 'name');

    return success({ ...location, children, cis });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const location = await db('locations').where({ id: (await params).id }).first();
    if (!location) return notFound('Location');

    const body = await request.json();
    const updates = {};
    const fields = ['name', 'description', 'type', 'parentLocationId', 'status', 'latitude', 'longitude', 'streetAddress', 'city', 'stateProvince', 'postalCode', 'country'];
    fields.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });

    if (Object.keys(updates).length) {
      updates.updatedAt = new Date().toISOString();
      updates.updatedBy = auth.user.id;
      await db('locations').where({ id: (await params).id }).update(updates);
    }

    await logAudit({
      actorUserId: auth.user.id, entityType: 'location', entityId: (await params).id,
      action: 'updated', beforeData: location, afterData: updates,
    });

    const updated = await db('locations').where({ id: (await params).id }).first();
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
    const location = await db('locations').where({ id: (await params).id }).first();
    if (!location) return notFound('Location');

    await db('locations').where({ id: (await params).id }).del();

    await logAudit({
      actorUserId: auth.user.id, entityType: 'location', entityId: (await params).id,
      action: 'deleted', beforeData: location,
    });

    return success({ message: 'Location deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
