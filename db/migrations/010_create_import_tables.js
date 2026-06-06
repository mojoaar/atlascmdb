exports.up = async function (knex) {
  await knex.schema.createTable('import_sets', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).notNullable();
    t.string('sourceType', 100);
    t.string('sourceName', 255);
    t.string('status', 50).defaultTo('pending');
    t.uuid('createdBy').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
    t.timestamp('committedAt');
  });

  await knex.schema.createTable('import_set_rows', (t) => {
    t.uuid('id').primary();
    t.uuid('importSetId').references('id').inTable('import_sets').onDelete('CASCADE');
    t.integer('rowNumber');
    t.text('sourceData').notNullable();
    t.text('mappedData');
    t.string('validationStatus', 50).defaultTo('pending');
    t.text('errorMessages');
    t.string('destinationTable', 100);
    t.string('destinationRecordId', 36);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('import_mappings', (t) => {
    t.uuid('id').primary();
    t.uuid('importSetId').references('id').inTable('import_sets').onDelete('CASCADE');
    t.string('sourceField', 255).notNullable();
    t.string('targetField', 255).notNullable();
    t.string('transformRule', 500);
    t.boolean('required').defaultTo(false);
    t.integer('orderIndex').defaultTo(0);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('import_mappings');
  await knex.schema.dropTableIfExists('import_set_rows');
  await knex.schema.dropTableIfExists('import_sets');
};
