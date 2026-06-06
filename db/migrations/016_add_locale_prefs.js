exports.up = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.string('timezone', 100).defaultTo('UTC');
    t.string('clockFormat', 10).defaultTo('24h');
    t.string('dateFormat', 20).defaultTo('YYYY-MM-DD');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.dropColumn('dateFormat');
    t.dropColumn('clockFormat');
    t.dropColumn('timezone');
  });
};
