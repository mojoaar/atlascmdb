exports.up = async function (knex) {
  await knex.schema.createTable('audit_events', (t) => {
    t.uuid('id').primary();
    t.uuid('actorUserId').references('id').inTable('users').onDelete('SET NULL');
    t.string('entityType', 100).notNullable();
    t.string('entityId', 36).notNullable();
    t.string('action', 50).notNullable();
    t.text('beforeData');
    t.text('afterData');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_events');
};
