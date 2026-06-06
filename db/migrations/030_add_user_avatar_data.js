exports.up = async function (knex) {
  await knex.schema.alterTable('users', (t) => {
    t.binary('avatarData');
    t.string('avatarMimeType', 50);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('avatarMimeType');
    t.dropColumn('avatarData');
  });
};
