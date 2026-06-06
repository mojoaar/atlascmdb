exports.up = async function (knex) {
  await knex.schema.alterTable('users', (t) => {
    t.uuid('managerId').references('id').inTable('users').onDelete('SET NULL');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('managerId');
  });
};
