exports.up = async function (knex) {
  await knex.schema.createTable('teams', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).notNullable();
    t.text('description');
    t.string('type', 100).notNullable().comment('Functional, Hierarchical, Matrix');
    t.uuid('parentTeamId').references('id').inTable('teams').onDelete('SET NULL');
    t.string('ownershipScope', 100);
    t.string('status', 50).defaultTo('active');
    t.uuid('roleId').references('id').inTable('roles').onDelete('SET NULL');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
    t.timestamp('archivedAt');
  });

  await knex.schema.createTable('team_members', (t) => {
    t.uuid('id').primary();
    t.uuid('teamId').references('id').inTable('teams').onDelete('CASCADE');
    t.uuid('userId').references('id').inTable('users').onDelete('CASCADE');
    t.string('memberRole', 100).defaultTo('Member');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
    t.unique(['teamId', 'userId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('team_members');
  await knex.schema.dropTableIfExists('teams');
};
