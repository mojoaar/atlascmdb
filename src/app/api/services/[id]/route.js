import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth, requireEditor } from '../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

async function getFullService(id) {
  const db = getDb();
  const row = await db('service_base')
    .leftJoin('teams', 'service_base.ownerTeamId', 'teams.id')
    .leftJoin('business_services', 'service_base.id', 'business_services.serviceBaseId')
    .leftJoin('technical_services', 'service_base.id', 'technical_services.serviceBaseId')
    .select(
      'service_base.*',
      'teams.name as ownerTeamName',
      'business_services.id as businessServiceId',
      'business_services.businessCriticality',
      'business_services.businessOwner',
      'business_services.serviceTier',
      'technical_services.id as technicalServiceId',
      'technical_services.supportModel',
      'technical_services.serviceCategory'
    )
    .where('service_base.id', id)
    .first();

  if (!row) return null;

  const type = row.businessServiceId ? 'business' : row.technicalServiceId ? 'technical' : 'unknown';

  return {
    id: row.id, name: row.name, description: row.description,
    ownerTeamId: row.ownerTeamId, ownerTeamName: row.ownerTeamName,
    lifecycleStatus: row.lifecycleStatus, environment: row.environment,
    classification: row.classification,
    createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt,
    createdBy: row.createdBy, updatedBy: row.updatedBy,
    type,
    typeSpecific: type === 'business' ? {
      businessCriticality: row.businessCriticality,
      businessOwner: row.businessOwner,
      serviceTier: row.serviceTier,
    } : type === 'technical' ? {
      supportModel: row.supportModel,
      serviceCategory: row.serviceCategory,
    } : {},
  };
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const service = await getFullService((await params).id);
    if (!service) return notFound('Service');
    return success(service);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const existing = await db('service_base').where({ id: (await params).id }).first();
    if (!existing) return notFound('Service');

    const body = await request.json();
    const baseUpdates = {};
    const fields = ['name', 'description', 'ownerTeamId', 'lifecycleStatus', 'environment', 'classification'];
    fields.forEach(f => { if (body[f] !== undefined) baseUpdates[f] = body[f]; });
    if (baseUpdates.ownerTeamId === '') baseUpdates.ownerTeamId = null;

    if (Object.keys(baseUpdates).length) {
      baseUpdates.updatedAt = new Date().toISOString();
      await db('service_base').where({ id: (await params).id }).update(baseUpdates);
    }

    const business = await db('business_services').where({ serviceBaseId: (await params).id }).first();
    const technical = await db('technical_services').where({ serviceBaseId: (await params).id }).first();

    let childChanged = false;
    if (business && body.typeFields) {
      const updates = {};
      if (body.typeFields.businessCriticality) updates.businessCriticality = body.typeFields.businessCriticality;
      if (body.typeFields.businessOwner) updates.businessOwner = body.typeFields.businessOwner;
      if (body.typeFields.serviceTier) updates.serviceTier = body.typeFields.serviceTier;
      if (Object.keys(updates).length) {
        await db('business_services').where({ serviceBaseId: (await params).id }).update(updates);
        childChanged = true;
      }
    }

    if (technical && body.typeFields) {
      const updates = {};
      if (body.typeFields.supportModel) updates.supportModel = body.typeFields.supportModel;
      if (body.typeFields.serviceCategory) updates.serviceCategory = body.typeFields.serviceCategory;
      if (Object.keys(updates).length) {
        await db('technical_services').where({ serviceBaseId: (await params).id }).update(updates);
        childChanged = true;
      }
    }

    if (Object.keys(baseUpdates).length > 0 || childChanged) {
      await db('service_base').where({ id: (await params).id }).update({ updatedAt: new Date().toISOString(), updatedBy: auth.user.id });
    }

    await logAudit({
      actorUserId: auth.user.id, entityType: 'service', entityId: (await params).id,
      action: 'updated', beforeData: existing, afterData: baseUpdates,
    });

    const updated = await getFullService((await params).id);
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
    const service = await db('service_base').where({ id: (await params).id }).first();
    if (!service) return notFound('Service');

    await db('service_base').where({ id: (await params).id }).del();

    await logAudit({
      actorUserId: auth.user.id, entityType: 'service', entityId: (await params).id,
      action: 'deleted', beforeData: service,
    });

    return success({ message: 'Service deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
