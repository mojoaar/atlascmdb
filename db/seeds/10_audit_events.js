const { v4: uuidv4 } = require('uuid');

function ts(secondsAgo) {
  const d = new Date(Date.now() - secondsAgo * 1000);
  return d.toISOString();
}

exports.seed = async function (knex) {
  await knex('audit_events').del();

  const alice = await knex('users').where({ email: 'alice@atlas.local' }).first();
  const bob   = await knex('users').where({ email: 'bob@atlas.local' }).first();
  const diana = await knex('users').where({ email: 'diana@atlas.local' }).first();

  const svcCustomerPortal    = await knex('service_base').where({ name: 'Customer Portal' }).first();
  const svcAuthService       = await knex('service_base').where({ name: 'Authentication Service' }).first();
  const svcEmail             = await knex('service_base').where({ name: 'Email Service' }).first();
  const svcHR                = await knex('service_base').where({ name: 'HR Portal' }).first();
  const svcMonitoring        = await knex('service_base').where({ name: 'Monitoring Platform' }).first();
  const appAtlas              = await knex('application_base').where({ name: 'Atlas CMDB' }).first();
  const appEmployee           = await knex('application_base').where({ name: 'Employee Portal' }).first();
  const appMonitoring         = await knex('application_base').where({ name: 'Monitoring Dashboard' }).first();
  const ciProdWeb             = await knex('ci_base').where({ name: 'prod-web-01' }).first();
  const ciDbProd              = await knex('ci_base').where({ name: 'db-prod-01' }).first();
  const ciLbProd              = await knex('ci_base').where({ name: 'lb-prod-01' }).first();
  const ciK8s                 = await knex('ci_base').where({ name: 'k8s-prod-01' }).first();
  const rackA                 = await knex('ci_base').where({ name: 'RACK-A-01' }).first();
  const rackB                 = await knex('ci_base').where({ name: 'RACK-B-02' }).first();
  const rackC                 = await knex('ci_base').where({ name: 'RACK-C-01' }).first();
  const teamPlatform          = await knex('teams').where({ name: 'Platform Engineering' }).first();
  const teamIT                = await knex('teams').where({ name: 'IT Support' }).first();
  const teamSecurity          = await knex('teams').where({ name: 'Security Team' }).first();
  const teamDevOps            = await knex('teams').where({ name: 'DevOps Team' }).first();
  const locDenmark            = await knex('locations').where({ name: 'Denmark' }).first();
  const locPrimaryDC          = await knex('locations').where({ name: 'Primary Data Center' }).first();
  const locSweden             = await knex('locations').where({ name: 'Sweden' }).first();
  const locGermany            = await knex('locations').where({ name: 'Germany' }).first();
  const locSecondaryDC        = await knex('locations').where({ name: 'Secondary Data Center' }).first();
  const assetDell             = await knex('assets').where({ assetTag: 'HW-2024-001' }).first();
  const assetCisco            = await knex('assets').where({ assetTag: 'NW-2024-001' }).first();

  const ev = [];

  function e(action, entityType, entityId, actorUserId, daysAgo) {
    ev.push({
      id: uuidv4(),
      actorUserId,
      entityType,
      entityId,
      action,
      createdAt: ts(86400 * daysAgo),
    });
  }

  // Services
  if (svcCustomerPortal)  e('created',  'service', svcCustomerPortal.id, alice?.id, 30);
  if (svcCustomerPortal)  e('updated',  'service', svcCustomerPortal.id, bob?.id,   14);
  if (svcAuthService)     e('created',  'service', svcAuthService.id,    alice?.id, 28);
  if (svcEmail)           e('created',  'service', svcEmail.id,          alice?.id, 20);
  if (svcEmail)           e('updated',  'service', svcEmail.id,          bob?.id,    7);
  if (svcHR)              e('created',  'service', svcHR.id,             alice?.id, 15);
  if (svcMonitoring)      e('created',  'service', svcMonitoring.id,     alice?.id, 10);

  // Applications
  if (appAtlas)            e('created',  'application', appAtlas.id,         alice?.id, 25);
  if (appAtlas)            e('updated',  'application', appAtlas.id,         bob?.id,    5);
  if (appEmployee)         e('created',  'application', appEmployee.id,      alice?.id, 12);
  if (appMonitoring)       e('created',  'application', appMonitoring.id,    alice?.id,  9);

  // CIs
  if (ciProdWeb)           e('created',  'ci', ciProdWeb.id,   alice?.id, 22);
  if (ciDbProd)            e('created',  'ci', ciDbProd.id,    bob?.id,   18);
  if (ciLbProd)            e('created',  'ci', ciLbProd.id,    diana?.id, 11);
  if (ciK8s)               e('created',  'ci', ciK8s.id,       alice?.id,  8);
  if (rackA)                e('created',  'ci', rackA.id,         alice?.id, 21);
  if (rackB)                e('created',  'ci', rackB.id,         bob?.id,   17);
  if (rackC)                e('created',  'ci', rackC.id,         diana?.id,  7);

  // Teams
  if (teamPlatform)         e('created',  'team', teamPlatform.id,   alice?.id, 30);
  if (teamIT)               e('created',  'team', teamIT.id,         alice?.id, 29);
  if (teamSecurity)         e('created',  'team', teamSecurity.id,   diana?.id, 16);
  if (teamDevOps)           e('created',  'team', teamDevOps.id,     diana?.id,  6);

  // Locations
  if (locDenmark)           e('created',  'location', locDenmark.id,     alice?.id, 30);
  if (locPrimaryDC)         e('created',  'location', locPrimaryDC.id,   alice?.id, 28);
  if (locSweden)            e('created',  'location', locSweden.id,      bob?.id,   13);
  if (locGermany)           e('created',  'location', locGermany.id,     bob?.id,   12);
  if (locSecondaryDC)       e('created',  'location', locSecondaryDC.id, diana?.id,  6);

  // Assets
  if (assetDell)            e('created',  'asset', assetDell.id,   alice?.id, 19);
  if (assetCisco)           e('created',  'asset', assetCisco.id,  diana?.id, 10);

  // Auth events
  if (alice)  e('login', 'auth', alice.id,  alice.id,  0.04);
  if (bob)    e('login', 'auth', bob.id,    bob.id,    0.12);
  if (diana)  e('login', 'auth', diana.id,  diana.id,  0.20);

  if (ev.length) await knex('audit_events').insert(ev);
};
