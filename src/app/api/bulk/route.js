import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../lib/db';
import { requireAdmin } from '../../../lib/rbac';
import { handleApiError, success, badRequest, guardResponse } from '../../../lib/api-helpers';
import { logAudit } from '../../../lib/audit';

// Maps the entity type to its base table. Child tables (business_services,
// technical_services, applications, cis) cascade-delete from their *_base via
// ON DELETE CASCADE. Polymorphic relationships, entity_tags, and notifications
// are manually deleted in a transaction for graph entities (services, applications, CIs).
const TABLE_MAP = {
  services: { base: 'service_base' },
  applications: { base: 'application_base' },
  cis: { base: 'ci_base' },
  assets: { base: 'assets' },
  teams: { base: 'teams' },
  locations: { base: 'locations' },
  relationships: { base: 'relationships' },
  users: { base: 'users' },
  roles: { base: 'roles' },
  themes: { base: 'themes' },
};

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { entityType, action, ids } = await request.json();

    if (!entityType || !action || !ids?.length) {
      return badRequest('entityType, action, and ids are required');
    }

    const config = TABLE_MAP[entityType];
    if (!config) return badRequest(`Unknown entity type: ${entityType}`);

    const db = getDb();

    if (action === 'delete') {
      if (entityType === 'users') {
        const beforeRecords = await db('users').whereIn('id', ids);
        const updated = await db('users').whereIn('id', ids).update({ status: 'disabled', updatedAt: new Date().toISOString() });
        for (const record of beforeRecords) {
          await logAudit({
            actorUserId: auth.user.id,
            entityType: 'user',
            entityId: record.id,
            action: 'disabled',
            beforeData: { email: record.email },
          });
        }
        return success({ deleted: updated });
      }

      let deletableIds = ids;
      if (entityType === 'themes') {
        const nonSystemThemes = await db('themes').whereIn('id', ids).where(function() {
          this.where('isSystem', false).orWhere('isSystem', 0).orWhereNull('isSystem');
        });
        deletableIds = nonSystemThemes.map(t => t.id);
        if (deletableIds.length === 0) {
          return badRequest('Cannot delete system themes');
        }
      }

      const beforeRecords = await db(config.base).whereIn('id', deletableIds);
      
      await db.transaction(async (trx) => {
        const singularType = entityType.replace(/s$/, '');
        if (['service', 'application', 'ci', 'asset'].includes(singularType)) {
          await trx('relationships').where(function() {
            this.where({ sourceType: singularType }).whereIn('sourceId', deletableIds)
                .orWhere({ targetType: singularType }).whereIn('targetId', deletableIds);
          }).del();
          await trx('entity_tags').where({ entityType: singularType }).whereIn('entityId', deletableIds).del();
          await trx('notifications').where({ entityType: singularType }).whereIn('entityId', deletableIds).del();
        }
        await trx(config.base).whereIn('id', deletableIds).del();
      });

      for (const record of beforeRecords) {
        await logAudit({
          actorUserId: auth.user.id,
          entityType: entityType.replace(/s$/, ''),
          entityId: record.id,
          action: 'deleted',
          beforeData: record,
        });
      }

      return success({ deleted: deletableIds.length });
    }

    return badRequest(`Unknown action: ${action}`);
  } catch (error) {
    return handleApiError(error);
  }
}
