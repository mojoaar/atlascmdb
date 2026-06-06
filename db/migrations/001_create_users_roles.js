exports.up = async function (knex) {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary();
    t.string('email', 255).unique().notNullable();
    t.string('passwordHash', 255).notNullable();
    t.string('displayName', 255).notNullable();
    t.string('status', 50).defaultTo('active');
    t.boolean('mfaEnabled').defaultTo(false);
    t.string('mfaSecret', 255);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('roles', (t) => {
    t.uuid('id').primary();
    t.string('name', 100).unique().notNullable();
    t.string('description', 500);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_roles', (t) => {
    t.uuid('userId').references('id').inTable('users').onDelete('CASCADE');
    t.uuid('roleId').references('id').inTable('roles').onDelete('CASCADE');
    t.primary(['userId', 'roleId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
};
