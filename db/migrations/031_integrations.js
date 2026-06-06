exports.up = async function (knex) {
  await knex.schema.createTable('integration_connectors', (t) => {
    t.uuid('id').primary();
    t.text('name').notNullable();
    t.text('connectorType').notNullable();
    t.boolean('enabled').notNullable().defaultTo(false);
    t.text('baseUrl');
    t.text('apiKey');
    t.text('config');
    t.text('conflictMode').notNullable().defaultTo('merge');
    t.text('fieldOverrides');
    t.timestamp('lastSyncAt');
    t.text('lastSyncStatus');
    t.text('lastSyncSummary');
    t.uuid('createdBy').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('integration_sync_logs', (t) => {
    t.uuid('id').primary();
    t.uuid('connectorId').notNullable().references('id').inTable('integration_connectors').onDelete('CASCADE');
    t.uuid('triggeredBy').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('startedAt').notNullable();
    t.timestamp('completedAt');
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
