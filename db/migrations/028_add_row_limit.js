exports.up = async function (knex) {
  await knex.raw('ALTER TABLE user_theme_preferences ADD COLUMN rowLimit INTEGER');
};

exports.down = async function (knex) {
  await knex.raw('ALTER TABLE user_theme_preferences DROP COLUMN rowLimit');
};
