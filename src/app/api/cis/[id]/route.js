import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

async function getFullCi(id) {
  const db = getDb();
  const row = await db('ci_base')
    .leftJoin('teams', 'ci_base.ownerTeamId', 'teams.id')
    .leftJoin('locations', 'ci_base.locationId', 'locations.id')
    .leftJoin('cis', 'ci_base.id', 'cis.ciBaseId')
    .select(
      'ci_base.*',
      'teams.name as ownerTeamName',
      'locations.name as locationName',
      'cis.id as childId', 'cis.ciType', 'cis.serialNumber', 'cis.assetTag', 'cis.rackSize', 'cis.rackModel'
    )
    .where('ci_base.id', id)
    .first();

  if (!row) return null;

  return {
    id: row.id, name: row.name, description: row.description,
    ownerTeamId: row.ownerTeamId, ownerTeamName: row.ownerTeamName,
    locationId: row.locationId, locationName: row.locationName,
    lifecycleStatus: row.lifecycleStatus, environment: row.environment,
    classification: row.classification, externalRef: row.externalRef,
    createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt,
    createdBy: row.createdBy, updatedBy: row.updatedBy,
    ciType: row.ciType, serialNumber: row.serialNumber, assetTag: row.assetTag,
    rackSize: row.rackSize, rackModel: row.rackModel,
  };
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const ci = await getFullCi((await params).id);
    if (!ci) return notFound('CI');
    return success(ci);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const existing = await db('ci_base').where({ id: (await params).id }).first();
    if (!existing) return notFound('CI');

    const body = await request.json();
    const baseUpdates = {};
    const fields = ['name', 'description', 'ownerTeamId', 'locationId', 'lifecycleStatus', 'environment', 'classification', 'externalRef'];
    fields.forEach(f => { if (body[f] !== undefined) baseUpdates[f] = body[f]; });
    if (baseUpdates.ownerTeamId === '') baseUpdates.ownerTeamId = null;
    if (baseUpdates.locationId === '') baseUpdates.locationId = null;

    if (Object.keys(baseUpdates).length) {
      baseUpdates.updatedAt = new Date().toISOString();
      await db('ci_base').where({ id: (await params).id }).update(baseUpdates);
    }

    const ciUpdates = {};
    if (body.ciType) ciUpdates.ciType = body.ciType;
    if (body.serialNumber) ciUpdates.serialNumber = body.serialNumber;
    if (body.assetTag) ciUpdates.assetTag = body.assetTag;
    if (body.rackSize !== undefined) ciUpdates.rackSize = body.rackSize || null;
    if (body.rackModel !== undefined) ciUpdates.rackModel = body.rackModel || null;
    if (Object.keys(ciUpdates).length) {
      await db('cis').where({ ciBaseId: (await params).id }).update(ciUpdates);
    }

    if (Object.keys(baseUpdates).length || Object.keys(ciUpdates).length) {
      await db('ci_base').where({ id: (await params).id }).update({ updatedAt: new Date().toISOString(), updatedBy: auth.user.id });
    }

    await logAudit({
      actorUserId: auth.user.id, entityType: 'ci', entityId: (await params).id,
      action: 'updated', beforeData: existing, afterData: baseUpdates,
    });

    const updated = await getFullCi((await params).id);
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
    const ci = await db('ci_base').where({ id: (await params).id }).first();
    if (!ci) return notFound('CI');

    await db('ci_base').where({ id: (await params).id }).del();

    await logAudit({
      actorUserId: auth.user.id, entityType: 'ci', entityId: (await params).id,
      action: 'deleted', beforeData: ci,
    });

    return success({ message: 'CI deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
