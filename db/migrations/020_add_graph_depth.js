exports.up = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.integer('graphDepth').defaultTo(3);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.dropColumn('graphDepth');
  });
};
