exports.up = async function (knex) {
  await knex.schema.alterTable('themes', (t) => {
    t.text('tokenSetLight');
    t.text('tokenSetDark');
  });
  await knex('themes').where({ mode: 'light' }).update({
    tokenSetLight: knex.ref('tokenSet'),
  });
  await knex('themes').where({ mode: 'dark' }).update({
    tokenSetDark: knex.ref('tokenSet'),
  });
  await knex.schema.alterTable('themes', (t) => {
    t.dropColumn('tokenSet');
    t.dropColumn('mode');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('themes', (t) => {
    t.text('tokenSet');
    t.string('mode', 50).defaultTo('light');
  });
  await knex('themes').whereNotNull('tokenSetLight').update({
    tokenSet: knex.ref('tokenSetLight'),
    mode: 'light',
  });
  await knex('themes').whereNotNull('tokenSetDark').whereNull('tokenSet').update({
    tokenSet: knex.ref('tokenSetDark'),
    mode: 'dark',
  });
  await knex.schema.alterTable('themes', (t) => {
    t.dropColumn('tokenSetLight');
    t.dropColumn('tokenSetDark');
  });
};
