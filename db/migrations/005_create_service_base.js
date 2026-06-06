exports.up = async function (knex) {
  await knex.schema.createTable('service_base', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).notNullable();
    t.text('description');
    t.uuid('ownerTeamId').references('id').inTable('teams').onDelete('SET NULL');
    t.string('lifecycleStatus', 100);
    t.string('environment', 100);
    t.string('classification', 100);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
    t.timestamp('archivedAt');
  });

  await knex.schema.createTable('business_services', (t) => {
    t.uuid('id').primary();
    t.uuid('serviceBaseId').unique().references('id').inTable('service_base').onDelete('CASCADE');
    t.string('businessCriticality', 100);
    t.string('businessOwner', 255);
    t.string('serviceTier', 100);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('technical_services', (t) => {
    t.uuid('id').primary();
    t.uuid('serviceBaseId').unique().references('id').inTable('service_base').onDelete('CASCADE');
    t.string('supportModel', 100);
    t.string('serviceCategory', 100);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('technical_services');
  await knex.schema.dropTableIfExists('business_services');
  await knex.schema.dropTableIfExists('service_base');
};
