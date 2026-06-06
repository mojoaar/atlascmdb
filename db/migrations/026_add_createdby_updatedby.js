exports.up = async function (knex) {
  const tables = [
    'service_base', 'application_base', 'ci_base',
    'assets', 'teams', 'locations',
    'users', 'roles', 'themes', 'relationships',
  ];
  for (const table of tables) {
    await knex.raw(`ALTER TABLE ${table} ADD COLUMN createdBy TEXT`);
    await knex.raw(`ALTER TABLE ${table} ADD COLUMN updatedBy TEXT`);
  }
};

exports.down = async function (knex) {
  const tables = [
    'service_base', 'application_base', 'ci_base',
    'assets', 'teams', 'locations',
    'users', 'roles', 'themes', 'relationships',
  ];
  for (const table of tables) {
    await knex.raw(`ALTER TABLE ${table} DROP COLUMN updatedBy`);
    await knex.raw(`ALTER TABLE ${table} DROP COLUMN createdBy`);
  }
};
