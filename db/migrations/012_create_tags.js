exports.up = async function (knex) {
  await knex.schema.createTable('tags', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).unique().notNullable();
    t.string('color', 50);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('entity_tags', (t) => {
    t.uuid('id').primary();
    t.string('entityType', 100).notNullable();
    t.string('entityId', 36).notNullable();
    t.uuid('tagId').references('id').inTable('tags').onDelete('CASCADE');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.unique(['entityType', 'entityId', 'tagId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('entity_tags');
  await knex.schema.dropTableIfExists('tags');
};
