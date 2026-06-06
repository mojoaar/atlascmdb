exports.up = async function (knex) {
  await knex.schema.alterTable('users', (t) => {
    t.string('avatarUrl', 512);
    t.string('avatarBg', 20).defaultTo('#003d7a');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('avatarBg');
    t.dropColumn('avatarUrl');
  });
};
