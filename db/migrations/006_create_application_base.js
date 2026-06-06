exports.up = async function (knex) {
  await knex.schema.createTable('application_base', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).notNullable();
    t.text('description');
    t.uuid('ownerTeamId').references('id').inTable('teams').onDelete('SET NULL');
    t.string('lifecycleStatus', 100);
    t.string('environment', 100);
    t.string('vendor', 255);
    t.string('version', 100);
    t.string('classification', 100);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
    t.timestamp('archivedAt');
  });

  await knex.schema.createTable('applications', (t) => {
    t.uuid('id').primary();
    t.uuid('applicationBaseId').unique().references('id').inTable('application_base').onDelete('CASCADE');
    t.string('appType', 100);
    t.string('technologyStack', 255);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('applications');
  await knex.schema.dropTableIfExists('application_base');
};
