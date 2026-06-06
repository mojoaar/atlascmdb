exports.up = async function (knex) {
  await knex.schema.alterTable('teams', (t) => {
    t.uuid('managerId').references('id').inTable('users').onDelete('SET NULL');
    t.uuid('leadId').references('id').inTable('users').onDelete('SET NULL');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('teams', (t) => {
    t.dropColumn('leadId');
    t.dropColumn('managerId');
  });
};
