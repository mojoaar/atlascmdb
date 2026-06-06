exports.up = async function (knex) {
  await knex.raw('ALTER TABLE cis ADD COLUMN rackSize INTEGER');
  await knex.raw('ALTER TABLE cis ADD COLUMN rackModel VARCHAR(255)');

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
  await knex.raw('ALTER TABLE cis DROP COLUMN rackSize');
  await knex.raw('ALTER TABLE cis DROP COLUMN rackModel');
};
