const crypto = require('crypto');

exports.up = async function (knex) {
  const row = await knex('app_config').where({ key: 'scim_bearer_token' }).first();
  if (row && row.value && row.value.length !== 64) {
    const hash = crypto.createHash('sha256').update(row.value).digest('hex');
    await knex('app_config').where({ key: 'scim_bearer_token' }).update({ value: hash });
  }
};

exports.down = async function (knex) {
  // Irreversible
};
