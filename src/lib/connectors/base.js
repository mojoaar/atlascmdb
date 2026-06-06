import { v4 as uuidv4 } from 'uuid';

const CONFLICT_MODES = ['overwrite', 'merge', 'skip'];

function getConflictMode(fieldName, connector) {
  let overrides = {};
  try {
    if (connector.fieldOverrides) {
      overrides = typeof connector.fieldOverrides === 'string'
        ? JSON.parse(connector.fieldOverrides)
        : connector.fieldOverrides;
    }
  } catch { /* ignore */ }

  if (overrides[fieldName] && CONFLICT_MODES.includes(overrides[fieldName])) {
    return overrides[fieldName];
  }

  const globalMode = connector.conflictMode || 'merge';
  return CONFLICT_MODES.includes(globalMode) ? globalMode : 'merge';
}

export function applyConflictMode(existing, incoming, connector) {
  if (!existing) return incoming;

  const merged = {};
  for (const [field, value] of Object.entries(incoming)) {
    const mode = getConflictMode(field, connector);

    if (mode === 'skip') continue;

    if (mode === 'overwrite') {
      merged[field] = value;
      continue;
    }

    if (mode === 'merge') {
      const existingValue = existing[field];
      const isEmpty = existingValue === null || existingValue === undefined || existingValue === '';
      merged[field] = isEmpty ? value : existingValue;
    }
  }

  return merged;
}

export async function upsertService(db, incoming, connector) {
  const externalRef = incoming.externalRef;
  if (!externalRef) return { action: 'skipped', id: null, reason: 'Missing externalRef' };

  const existing = await db('service_base').where({ externalRef }).first();

  if (existing) {
    const merged = applyConflictMode(existing, incoming, connector);

    const type = merged.type || existing.type || 'business';
    if (type !== existing.type) merged.type = type;

    const baseFields = { name: merged.name, description: merged.description, ownerTeamId: merged.ownerTeamId, lifecycleStatus: merged.lifecycleStatus, environment: merged.environment, classification: merged.classification, externalRef: merged.externalRef || existing.externalRef, updatedAt: new Date().toISOString() };
    await db('service_base').where({ id: existing.id }).update(baseFields);

    if (type === 'business') {
      await db('business_services').where({ serviceBaseId: existing.id }).update({ businessCriticality: merged.businessCriticality, businessOwner: merged.businessOwner, serviceTier: merged.serviceTier, supportModel: merged.supportModel, serviceCategory: merged.serviceCategory });
    } else {
      await db('technical_services').where({ serviceBaseId: existing.id }).update({});
    }

    return { action: 'updated', id: existing.id };
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const type = incoming.type || 'business';

  await db('service_base').insert({ id, name: incoming.name, description: incoming.description || null, ownerTeamId: incoming.ownerTeamId || null, lifecycleStatus: incoming.lifecycleStatus || 'active', environment: incoming.environment || null, classification: incoming.classification || null, externalRef, type, createdAt: now, updatedAt: now });

  if (type === 'business') {
    await db('business_services').insert({ serviceBaseId: id, businessCriticality: incoming.businessCriticality || null, businessOwner: incoming.businessOwner || null, serviceTier: incoming.serviceTier || null, supportModel: incoming.supportModel || null, serviceCategory: incoming.serviceCategory || null });
  } else {
    await db('technical_services').insert({ serviceBaseId: id });
  }

  return { action: 'created', id };
}

export async function upsertApplication(db, incoming, connector) {
  const externalRef = incoming.externalRef;
  if (!externalRef) return { action: 'skipped', id: null, reason: 'Missing externalRef' };

  const existing = await db('application_base').where({ externalRef }).first();

  if (existing) {
    const merged = applyConflictMode(existing, incoming, connector);

    const baseFields = { name: merged.name, description: merged.description, ownerTeamId: merged.ownerTeamId, lifecycleStatus: merged.lifecycleStatus, environment: merged.environment, classification: merged.classification, externalRef: merged.externalRef || existing.externalRef, updatedAt: new Date().toISOString() };
    await db('application_base').where({ id: existing.id }).update(baseFields);

    await db('applications').where({ applicationBaseId: existing.id }).update({ vendor: merged.vendor || null, version: merged.version || null, appType: merged.appType || null, technologyStack: merged.technologyStack || null });

    return { action: 'updated', id: existing.id };
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  await db('application_base').insert({ id, name: incoming.name, description: incoming.description || null, ownerTeamId: incoming.ownerTeamId || null, lifecycleStatus: incoming.lifecycleStatus || 'active', environment: incoming.environment || null, classification: incoming.classification || null, externalRef, createdAt: now, updatedAt: now });

  await db('applications').insert({ applicationBaseId: id, vendor: incoming.vendor || null, version: incoming.version || null, appType: incoming.appType || null, technologyStack: incoming.technologyStack || null });

  return { action: 'created', id };
}

export async function upsertRelationship(db, incoming) {
  if (!incoming.sourceType || !incoming.targetType || !incoming.relationshipType) {
    return { action: 'skipped', id: null, reason: 'Missing required relationship fields' };
  }

  const existing = await db('relationships')
    .where({ sourceType: incoming.sourceType, sourceId: incoming.sourceId, targetType: incoming.targetType, targetId: incoming.targetId, relationshipType: incoming.relationshipType })
    .first();

  if (existing) {
    if (incoming.notes && existing.notes !== incoming.notes) {
      await db('relationships').where({ id: existing.id }).update({ notes: incoming.notes, updatedAt: new Date().toISOString() });
      return { action: 'updated', id: existing.id };
    }
    return { action: 'skipped', id: existing.id, reason: 'No changes' };
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  await db('relationships').insert({ id, sourceType: incoming.sourceType, sourceId: incoming.sourceId, targetType: incoming.targetType, targetId: incoming.targetId, relationshipType: incoming.relationshipType, direction: incoming.direction || 'outbound', notes: incoming.notes || null, createdAt: now, updatedAt: now });

  return { action: 'created', id };
}
