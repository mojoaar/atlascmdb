import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../../lib/rbac';
import { handleApiError, success, created, notFound, badRequest } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

async function getRackAndSize(rackId) {
  const db = getDb();
  const rack = await db('ci_base')
    .leftJoin('cis', 'ci_base.id', 'cis.ciBaseId')
    .select('ci_base.id', 'cis.rackSize', 'cis.ciType')
    .where('ci_base.id', rackId)
    .first();
  return rack;
}

function checkOverlap(placements, startU, occupiedUs, excludeId) {
  const endU = startU + occupiedUs - 1;
  return placements.some(p => {
    if (p.id === excludeId) return false;
    const pEnd = p.startU + (p.occupiedUs || 1) - 1;
    return startU <= pEnd && endU >= p.startU;
  });
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const rackId = (await params).id;

    const placements = await db('rack_placements')
      .leftJoin('ci_base', 'rack_placements.ciId', 'ci_base.id')
      .leftJoin('cis', 'ci_base.id', 'cis.ciBaseId')
      .select(
        'rack_placements.*',
        'ci_base.name as ciName',
        'cis.ciType as ciType',
        'cis.serialNumber as ciSerialNumber',
        'cis.rackSize as ciRackSize'
      )
      .where('rack_placements.rackId', rackId)
      .orderBy('rack_placements.startU', 'desc');

    return success(placements);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const rackId = (await params).id;
    const { ciId, startU, occupiedUs, position, label } = await request.json();

    if (!ciId) return badRequest('ciId is required');
    if (startU === undefined || startU === null) return badRequest('startU is required');

    const rack = await getRackAndSize(rackId);
    if (!rack || rack.ciType !== 'rack') return badRequest('Target is not a rack');

    if (ciId === rackId) return badRequest('Cannot place a rack into itself');

    const ci = await db('ci_base').where({ id: ciId }).first();
    if (!ci) return notFound('CI');

    const size = rack.rackSize || 42;
    const occupied = occupiedUs || 1;
    if (startU < 1) return badRequest('startU must be >= 1');
    if (startU + occupied - 1 > size) return badRequest(`Placement exceeds rack size (${size}U)`);

    const existingPlacements = await db('rack_placements').where({ rackId });
    if (checkOverlap(existingPlacements, startU, occupied)) {
      return badRequest('Placement overlaps with an existing rack placement');
    }

    const id = uuidv4();
    await db('rack_placements').insert({
      id, rackId, ciId, startU, occupiedUs: occupied,
      position: position || 'front', label: label || null,
    });

    try {
      await db('relationships').insert({
        id: uuidv4(),
        sourceType: 'ci', sourceId: rackId,
        targetType: 'ci', targetId: ciId,
        relationshipType: 'hosted_on', direction: 'outbound',
      });
    } catch {}

    await logAudit({
      actorUserId: auth.user.id, entityType: 'rack_placement', entityId: id,
      action: 'created',
      afterData: { rackId, ciId, startU, occupiedUs: occupied, position, label },
    });

    return created({ id, rackId, ciId, startU, occupiedUs: occupied, position, label });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const rackId = (await params).id;
    const { id, startU, occupiedUs, position, label } = await request.json();

    if (!id) return badRequest('Placement id is required');

    const placement = await db('rack_placements').where({ id, rackId }).first();
    if (!placement) return notFound('Placement');

    const rack = await getRackAndSize(rackId);
    const size = rack?.rackSize || 42;
    const newStartU = startU !== undefined ? startU : placement.startU;
    const newOccupied = occupiedUs !== undefined ? occupiedUs : placement.occupiedUs;

    if (newStartU < 1) return badRequest('startU must be >= 1');
    if (newStartU + newOccupied - 1 > size) return badRequest(`Placement exceeds rack size (${size}U)`);

    const otherPlacements = await db('rack_placements').where({ rackId }).whereNot({ id });
    if (checkOverlap(otherPlacements, newStartU, newOccupied)) {
      return badRequest('Placement overlaps with an existing rack placement');
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (startU !== undefined) updates.startU = startU;
    if (occupiedUs !== undefined) updates.occupiedUs = occupiedUs;
    if (position !== undefined) updates.position = position;
    if (label !== undefined) updates.label = label || null;

    await db('rack_placements').where({ id }).update(updates);

    await logAudit({
      actorUserId: auth.user.id, entityType: 'rack_placement', entityId: id,
      action: 'updated', beforeData: placement, afterData: { ...placement, ...updates },
    });

    return success({ id, ...placement, ...updates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const rackId = (await params).id;
    const { id } = await request.json();

    if (!id) return badRequest('Placement id is required');

    const placement = await db('rack_placements').where({ id, rackId }).first();
    if (!placement) return notFound('Placement');

    await db('rack_placements').where({ id }).del();

    try {
      await db('relationships')
        .where({ sourceType: 'ci', sourceId: rackId, targetType: 'ci', targetId: placement.ciId, relationshipType: 'hosted_on' })
        .del();
    } catch {}

    await logAudit({
      actorUserId: auth.user.id, entityType: 'rack_placement', entityId: id,
      action: 'deleted', beforeData: placement, afterData: null,
    });

    return success({ message: 'Placement removed' });
  } catch (error) {
    return handleApiError(error);
  }
}
