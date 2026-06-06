exports.up = async function (knex) {
  await knex.schema.createTable('themes', (t) => {
    t.uuid('id').primary();
    t.string('name', 255).notNullable();
    t.string('mode', 50).defaultTo('light');
    t.text('tokenSet').notNullable();
    t.boolean('isDefault').defaultTo(false);
    t.boolean('isSystem').defaultTo(false);
    t.string('status', 50).defaultTo('active');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_theme_preferences', (t) => {
    t.uuid('id').primary();
    t.uuid('userId').unique().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('themeId').references('id').inTable('themes').onDelete('SET NULL');
    t.string('modePreference', 50).defaultTo('light');
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_theme_preferences');
  await knex.schema.dropTableIfExists('themes');
};
