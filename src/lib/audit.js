import { v4 as uuidv4 } from 'uuid';
import getDb from './db';

export async function logAudit({ actorUserId, entityType, entityId, action, beforeData, afterData }) {
  const db = getDb();
  await db('audit_events').insert({
    id: uuidv4(),
    actorUserId: actorUserId || null,
    entityType,
    entityId,
    action,
    beforeData: beforeData ? JSON.stringify(beforeData) : null,
    afterData: afterData ? JSON.stringify(afterData) : null,
    createdAt: new Date().toISOString(),
  });

  if (entityType && entityId && ['created', 'updated', 'deleted'].includes(action)) {
    const notification = NOTIFICATION_MAP[`${entityType}.${action}`];
    if (notification) {
      const entity = await db(TABLE_LOOKUP[entityType] || entityType + 's').where({ id: entityId }).first();
      const name = entity?.name || entityId;
      await sendEntityNotification(db, {
        entityType, entityId, name,
        actorUserId,
        title: `${name} ${notification}`,
        type: action === 'deleted' ? 'warning' : 'info',
      });
    }
  }
}

const NOTIFICATION_MAP = {
  'service.created': 'was created',
  'service.updated': 'was updated',
  'service.deleted': 'was deleted',
  'application.created': 'was created',
  'application.updated': 'was updated',
  'application.deleted': 'was deleted',
  'ci.created': 'was created',
  'ci.updated': 'was updated',
  'ci.deleted': 'was deleted',
  'asset.created': 'was created',
  'asset.updated': 'was updated',
  'asset.deleted': 'was deleted',
  'team.created': 'was created',
  'team.updated': 'was updated',
  'team.deleted': 'was deleted',
  'location.created': 'was created',
  'location.updated': 'was updated',
  'location.deleted': 'was deleted',
  'relationship.created': 'was created',
  'relationship.updated': 'was updated',
  'relationship.deleted': 'was deleted',
};

const TABLE_LOOKUP = {
  service: 'service_base',
  application: 'application_base',
  ci: 'ci_base',
};

async function sendEntityNotification(db, { entityType, entityId, name, actorUserId, title, type }) {
  const userIds = new Set();

  const ownerField = ENTITY_OWNER_FIELDS[entityType];
  if (ownerField) {
    const entity = await db(TABLE_LOOKUP[entityType] || `${entityType}s`).where({ id: entityId }).first();
    if (entity) {
      if (ownerField === 'ownerTeamId' && entity.ownerTeamId) {
        const members = await db('team_members').where({ teamId: entity.ownerTeamId }).select('userId');
        members.forEach(m => userIds.add(m.userId));
      }
      if (ownerField === 'assignedTo' && entity.assignedTo) {
        userIds.add(entity.assignedTo);
      }
    }
  }

  userIds.delete(actorUserId);

  if (userIds.size === 0) return;

  const inserts = [...userIds].map(userId => ({
    id: uuidv4(),
    userId,
    type,
    title,
    body: `${name} — ${entityType}`,
    entityType,
    entityId,
    read: false,
  }));

  await db('notifications').insert(inserts);
}

const ENTITY_OWNER_FIELDS = {
  service: 'ownerTeamId',
  application: 'ownerTeamId',
  ci: 'ownerTeamId',
  asset: 'assignedTo',
  team: null,
  location: null,
  relationship: null,
};

export async function getAuditTrail({ entityType, entityId, limit = 50 }) {
  const db = getDb();
  const query = db('audit_events')
    .leftJoin('users', 'audit_events.actorUserId', 'users.id')
    .select(
      'audit_events.*',
      'users.displayName as actorName',
      'users.email as actorEmail'
    )
    .orderBy('audit_events.createdAt', 'desc')
    .limit(limit);

  if (entityType) query.where('audit_events.entityType', entityType);
  if (entityId) query.where('audit_events.entityId', entityId);

  return query;
}
