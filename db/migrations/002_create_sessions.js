exports.up = async function (knex) {
  await knex.schema.createTable('sessions', (t) => {
    t.uuid('id').primary();
    t.uuid('userId').references('id').inTable('users').onDelete('CASCADE');
    t.string('refreshTokenHash', 255).notNullable();
    t.timestamp('expiresAt').notNullable();
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sessions');
};
