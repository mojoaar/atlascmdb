exports.up = async function (knex) {
  await knex.schema.createTable('asset_attachments', (t) => {
    t.uuid('id').primary();
    t.uuid('assetId').references('id').inTable('assets').onDelete('CASCADE');
    t.string('filename', 255).notNullable();
    t.string('mimeType', 100);
    t.integer('size');
    t.binary('data');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('asset_attachments');
};
