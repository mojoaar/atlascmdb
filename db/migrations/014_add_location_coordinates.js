exports.up = async function (knex) {
  await knex.schema.alterTable('locations', (t) => {
    t.decimal('latitude', 10, 7);
    t.decimal('longitude', 10, 7);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('locations', (t) => {
    t.dropColumn('latitude');
    t.dropColumn('longitude');
  });
};
