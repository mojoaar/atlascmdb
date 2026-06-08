const TABLES = [
  'service_base', 'application_base', 'ci_base',
  'assets', 'teams', 'locations',
  'users', 'roles', 'themes', 'relationships',
];

exports.up = async function (knex) {
  if (knex.client.config.client !== 'pg') return;
  for (const table of TABLES) {
    await knex.raw('ALTER TABLE ?? ALTER COLUMN "createdBy" TYPE uuid USING NULLIF("createdBy", \'\')::uuid', [table]);
    await knex.raw('ALTER TABLE ?? ALTER COLUMN "updatedBy" TYPE uuid USING NULLIF("updatedBy", \'\')::uuid', [table]);
  }
};

exports.down = async function (knex) {
  if (knex.client.config.client !== 'pg') return;
  for (const table of TABLES) {
    await knex.raw('ALTER TABLE ?? ALTER COLUMN "createdBy" TYPE text USING "createdBy"::text', [table]);
    await knex.raw('ALTER TABLE ?? ALTER COLUMN "updatedBy" TYPE text USING "updatedBy"::text', [table]);
  }
};
