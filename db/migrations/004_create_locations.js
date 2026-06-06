exports.up = async function (knex) {
  await knex.schema.createTable('locations', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).notNullable();
    t.text('description');
    t.string('type', 100);
    t.uuid('parentLocationId').references('id').inTable('locations').onDelete('SET NULL');
    t.string('status', 50).defaultTo('active');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
    t.timestamp('archivedAt');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('locations');
};
