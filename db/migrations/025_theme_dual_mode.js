exports.up = async function (knex) {
  await knex.raw('ALTER TABLE themes ADD COLUMN tokenSetLight TEXT');
  await knex.raw('ALTER TABLE themes ADD COLUMN tokenSetDark TEXT');
  await knex.raw("UPDATE themes SET tokenSetLight = tokenSet WHERE mode = 'light'");
  await knex.raw("UPDATE themes SET tokenSetDark = tokenSet WHERE mode = 'dark'");
  await knex.raw('ALTER TABLE themes DROP COLUMN tokenSet');
  await knex.raw('ALTER TABLE themes DROP COLUMN mode');
};

exports.down = async function (knex) {
  await knex.raw('ALTER TABLE themes ADD COLUMN tokenSet TEXT');
  await knex.raw("ALTER TABLE themes ADD COLUMN mode VARCHAR(50) DEFAULT 'light'");
  await knex.raw("UPDATE themes SET tokenSet = tokenSetLight, mode = 'light' WHERE tokenSetLight IS NOT NULL");
  await knex.raw("UPDATE themes SET tokenSet = tokenSetDark, mode = 'dark' WHERE tokenSetDark IS NOT NULL AND tokenSet IS NULL");
  await knex.raw('ALTER TABLE themes DROP COLUMN tokenSetLight');
  await knex.raw('ALTER TABLE themes DROP COLUMN tokenSetDark');
};
