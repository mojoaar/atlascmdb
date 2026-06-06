exports.up = async function (knex) {
  await knex.schema.createTable('relationships', (t) => {
    t.uuid('id').primary();
    t.string('sourceType', 100).notNullable();
    t.string('sourceId', 36).notNullable();
    t.string('targetType', 100).notNullable();
    t.string('targetId', 36).notNullable();
    t.string('relationshipType', 100);
    t.string('direction', 50);
    t.text('notes');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('relationships');
};
