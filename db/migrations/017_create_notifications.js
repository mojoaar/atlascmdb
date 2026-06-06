exports.up = async function (knex) {
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary();
    t.uuid('userId').references('id').inTable('users').onDelete('CASCADE').notNullable();
    t.string('type', 50).notNullable().defaultTo('info');
    t.string('title', 255).notNullable();
    t.text('body');
    t.string('entityType', 100);
    t.string('entityId', 36);
    t.boolean('read').notNullable().defaultTo(false);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_notifications_user_read ON notifications(userId, read)');
  await knex.schema.raw('CREATE INDEX idx_notifications_created ON notifications(createdAt)');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
};
