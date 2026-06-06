const { v4: uuidv4 } = require('uuid');

exports.up = async function (knex) {
  await knex.schema.createTable('app_config', (t) => {
    t.string('key', 100).primary();
    t.text('value');
  });

  const token = uuidv4();
  await knex('app_config').insert([
    { key: 'scim_enabled', value: 'false' },
    { key: 'scim_bearer_token', value: token },
    { key: 'sso_enabled', value: 'false' },
    { key: 'sso_provider', value: 'oidc' },
    { key: 'oidc_issuer_url', value: '' },
    { key: 'oidc_client_id', value: '' },
    { key: 'oidc_client_secret', value: '' },
  ]);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('app_config');
};
