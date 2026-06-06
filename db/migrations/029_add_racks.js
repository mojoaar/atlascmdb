exports.up = async function (knex) {
  await knex.schema.alterTable('cis', (t) => {
    t.integer('rackSize');
    t.string('rackModel', 255);
  });

  await knex.schema.createTable('rack_placements', (t) => {
    t.uuid('id').primary();
    t.uuid('rackId').notNullable().references('id').inTable('ci_base').onDelete('CASCADE');
    t.uuid('ciId').notNullable().references('id').inTable('ci_base').onDelete('CASCADE');
    t.integer('startU').notNullable();
    t.integer('occupiedUs').notNullable().defaultTo(1);
    t.string('position', 10).defaultTo('front');
    t.string('label', 255);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('rack_placements');
  await knex.schema.alterTable('cis', (t) => {
    t.dropColumn('rackSize');
    t.dropColumn('rackModel');
  });
};
