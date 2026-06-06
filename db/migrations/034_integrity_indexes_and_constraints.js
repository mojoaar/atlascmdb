exports.up = async function (knex) {
  await knex.schema.alterTable('relationships', (t) => {
    t.index(['sourceType', 'sourceId'], 'idx_relationships_source');
    t.index(['targetType', 'targetId'], 'idx_relationships_target');
    t.unique(['sourceType', 'sourceId', 'targetType', 'targetId', 'relationshipType'], 'uq_relationships_edge');
  });

  await knex.schema.alterTable('audit_events', (t) => {
    t.index(['entityType', 'entityId'], 'idx_audit_entity');
    t.index('actorUserId', 'idx_audit_actor');
  });

  await knex.schema.alterTable('entity_tags', (t) => {
    t.index(['entityType', 'entityId'], 'idx_tags_entity');
  });

  await knex.schema.alterTable('sessions', (t) => {
    t.index('userId', 'idx_sessions_user');
  });

  await knex.schema.alterTable('ci_base', (t) => {
    t.index('locationId', 'idx_ci_location');
    t.index('ownerTeamId', 'idx_ci_owner_team');
  });

  await knex.schema.alterTable('assets', (t) => {
    t.index('ciId', 'idx_assets_ci');
    t.index('assignedTo', 'idx_assets_assigned');
    t.index('locationId', 'idx_assets_location');
  });

  await knex.schema.alterTable('team_members', (t) => {
    t.index('userId', 'idx_team_members_user');
  });

  await knex.schema.alterTable('rack_placements', (t) => {
    t.index('rackId', 'idx_rack_placements_rack');
    t.index('ciId', 'idx_rack_placements_ci');
    t.unique(['rackId', 'startU', 'position'], 'uq_rack_placements_u');
  });

  await knex.schema.alterTable('service_base', (t) => {
    t.index('ownerTeamId', 'idx_service_owner_team');
  });

  await knex.schema.alterTable('application_base', (t) => {
    t.index('ownerTeamId', 'idx_application_owner_team');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('relationships', (t) => {
    t.dropIndex(['sourceType', 'sourceId'], 'idx_relationships_source');
    t.dropIndex(['targetType', 'targetId'], 'idx_relationships_target');
    t.dropUnique(['sourceType', 'sourceId', 'targetType', 'targetId', 'relationshipType'], 'uq_relationships_edge');
  });

  await knex.schema.alterTable('audit_events', (t) => {
    t.dropIndex(['entityType', 'entityId'], 'idx_audit_entity');
    t.dropIndex('actorUserId', 'idx_audit_actor');
  });

  await knex.schema.alterTable('entity_tags', (t) => {
    t.dropIndex(['entityType', 'entityId'], 'idx_tags_entity');
  });

  await knex.schema.alterTable('sessions', (t) => {
    t.dropIndex('userId', 'idx_sessions_user');
  });

  await knex.schema.alterTable('ci_base', (t) => {
    t.dropIndex('locationId', 'idx_ci_location');
    t.dropIndex('ownerTeamId', 'idx_ci_owner_team');
  });

  await knex.schema.alterTable('assets', (t) => {
    t.dropIndex('ciId', 'idx_assets_ci');
    t.dropIndex('assignedTo', 'idx_assets_assigned');
    t.dropIndex('locationId', 'idx_assets_location');
  });

  await knex.schema.alterTable('team_members', (t) => {
    t.dropIndex('userId', 'idx_team_members_user');
  });

  await knex.schema.alterTable('rack_placements', (t) => {
    t.dropIndex('rackId', 'idx_rack_placements_rack');
    t.dropIndex('ciId', 'idx_rack_placements_ci');
    t.dropUnique(['rackId', 'startU', 'position'], 'uq_rack_placements_u');
  });

  await knex.schema.alterTable('service_base', (t) => {
    t.dropIndex('ownerTeamId', 'idx_service_owner_team');
  });

  await knex.schema.alterTable('application_base', (t) => {
    t.dropIndex('ownerTeamId', 'idx_application_owner_team');
  });
};
