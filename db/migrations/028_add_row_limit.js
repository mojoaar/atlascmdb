exports.up = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.integer('rowLimit');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.dropColumn('rowLimit');
  });
};
