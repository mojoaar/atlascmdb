exports.up = async function (knex) {
  await knex.schema.createTable('integration_connectors', (t) => {
    t.text('id').primary();
    t.text('name').notNullable();
    t.text('connectorType').notNullable();
    t.integer('enabled').notNullable().defaultTo(0);
    t.text('baseUrl');
    t.text('apiKey');
    t.text('config');
    t.text('conflictMode').notNullable().defaultTo('merge');
    t.text('fieldOverrides');
    t.text('lastSyncAt');
    t.text('lastSyncStatus');
    t.text('lastSyncSummary');
    t.text('createdBy').references('id').inTable('users').onDelete('SET NULL');
    t.text('createdAt').notNullable().defaultTo(knex.fn.now());
    t.text('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('integration_sync_logs', (t) => {
    t.text('id').primary();
    t.text('connectorId').notNullable().references('id').inTable('integration_connectors').onDelete('CASCADE');
    t.text('triggeredBy').references('id').inTable('users').onDelete('SET NULL');
    t.text('startedAt').notNullable();
    t.text('completedAt');
    t.text('status').notNullable().defaultTo('running');
    t.integer('recordsCreated').notNullable().defaultTo(0);
    t.integer('recordsUpdated').notNullable().defaultTo(0);
    t.integer('recordsSkipped').notNullable().defaultTo(0);
    t.integer('recordsErrored').notNullable().defaultTo(0);
    t.text('errorMessage');
    t.text('detail');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('integration_sync_logs');
  await knex.schema.dropTableIfExists('integration_connectors');
};
