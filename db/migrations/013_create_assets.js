exports.up = async function (knex) {
  await knex.schema.createTable('assets', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).notNullable();
    t.string('assetTag', 100).unique();
    t.uuid('ciId').references('id').inTable('ci_base').onDelete('SET NULL');
    t.string('category', 50);
    t.string('model', 255);
    t.string('status', 50).defaultTo('in_stock');
    t.uuid('assignedTo').references('id').inTable('users').onDelete('SET NULL');
    t.uuid('locationId').references('id').inTable('locations').onDelete('SET NULL');
    t.string('supplier', 255);
    t.date('purchaseDate');
    t.date('warrantyExpiry');
    t.decimal('cost', 12, 2);
    t.text('notes');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assets');
};
