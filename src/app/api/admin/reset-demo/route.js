import getDb from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/rbac';
import { success, handleApiError, badRequest, guardResponse } from '../../../../lib/api-helpers';
import { logAudit } from '../../../../lib/audit';

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    // 1. Identify Alice Admin (must stay)
    const alice = await db('users').where({ email: 'alice@atlas.local' }).first();
    if (!alice) {
      return badRequest('Critical error: Alice Admin user not found. Reset aborted.');
    }

    // 2. Perform safe cascade deletes inside a transaction to prevent partial purges
    await db.transaction(async (trx) => {
      // Delete child relationship & asset data first
      await trx('rack_placements').del();
      await trx('asset_attachments').del();
      await trx('notifications').del();
      await trx('audit_events').del();
      await trx('entity_tags').del();
      await trx('tags').del();
      await trx('import_set_rows').del();
      await trx('import_mappings').del();
      await trx('import_sets').del();
      await trx('relationships').del();
      await trx('assets').del();

      // Delete CIs (child table then base table)
      await trx('cis').del();
      await trx('ci_base').del();

      // Delete Applications (child table then base table)
      await trx('applications').del();
      await trx('application_base').del();

      // Delete Services (child tables then base table)
      await trx('technical_services').del();
      await trx('business_services').del();
      await trx('service_base').del();

      // Delete locations
      await trx('locations').del();

      // Delete teams & memberships
      await trx('team_members').del();
      await trx('teams').del();

      // Delete user settings/relationships for everyone except Alice
      await trx('user_theme_preferences').whereNot({ userId: alice.id }).del();
      await trx('user_roles').whereNot({ userId: alice.id }).del();
      
      // Delete all sessions (Alice can stay logged in as her token is verified statelessly or her session can regenerate)
      await trx('sessions').del();

      // Delete all users except Alice
      await trx('users').whereNot({ id: alice.id }).del();
    });

    const isActorAlice = auth.user.id === alice.id;
    await logAudit({
      actorUserId: isActorAlice ? alice.id : null,
      entityType: 'system',
      entityId: 'reset-demo',
      action: 'demo_reset',
      beforeData: null,
      afterData: { message: 'Demo data successfully reset.' },
    });

    return success({ success: true, message: 'Demo data successfully reset. Only Alice Admin remains.' });
  } catch (err) {
    return handleApiError(err);
  }
}
