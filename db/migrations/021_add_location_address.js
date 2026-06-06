exports.up = async function (knex) {
  await knex.schema.alterTable('locations', (t) => {
    t.string('streetAddress', 255);
    t.string('city', 100);
    t.string('stateProvince', 100);
    t.string('postalCode', 20);
    t.string('country', 100);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('locations', (t) => {
    t.dropColumn('country');
    t.dropColumn('postalCode');
    t.dropColumn('stateProvince');
    t.dropColumn('city');
    t.dropColumn('streetAddress');
  });
};
