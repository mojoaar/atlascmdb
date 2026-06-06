exports.up = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.boolean('notifOnCreate').notNullable().defaultTo(true);
    t.boolean('notifOnUpdate').notNullable().defaultTo(true);
    t.boolean('notifOnDelete').notNullable().defaultTo(true);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('user_theme_preferences', (t) => {
    t.dropColumn('notifOnDelete');
    t.dropColumn('notifOnUpdate');
    t.dropColumn('notifOnCreate');
  });
};
