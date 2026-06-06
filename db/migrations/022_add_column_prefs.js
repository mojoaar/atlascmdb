exports.up = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.text('columnPrefs');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.dropColumn('columnPrefs');
  });
};
