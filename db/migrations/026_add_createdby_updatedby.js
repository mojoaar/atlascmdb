exports.up = async function (knex) {
  const tables = [
    'service_base', 'application_base', 'ci_base',
    'assets', 'teams', 'locations',
    'users', 'roles', 'themes', 'relationships',
  ];
  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.text('createdBy');
      t.text('updatedBy');
    });
  }
};

exports.down = async function (knex) {
  const tables = [
    'service_base', 'application_base', 'ci_base',
    'assets', 'teams', 'locations',
    'users', 'roles', 'themes', 'relationships',
  ];
  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn('updatedBy');
      t.dropColumn('createdBy');
    });
  }
};
