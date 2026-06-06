exports.up = async function (knex) {
  await knex.schema.createTable('ci_base', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).notNullable();
    t.text('description');
    t.uuid('ownerTeamId').references('id').inTable('teams').onDelete('SET NULL');
    t.uuid('locationId').references('id').inTable('locations').onDelete('SET NULL');
    t.string('lifecycleStatus', 100);
    t.string('environment', 100);
    t.string('classification', 100);
    t.string('externalRef', 255);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
    t.timestamp('archivedAt');
  });

  await knex.schema.createTable('cis', (t) => {
    t.uuid('id').primary();
    t.uuid('ciBaseId').unique().references('id').inTable('ci_base').onDelete('CASCADE');
    t.string('ciType', 100);
    t.string('serialNumber', 255);
    t.string('assetTag', 255);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('cis');
  await knex.schema.dropTableIfExists('ci_base');
};
