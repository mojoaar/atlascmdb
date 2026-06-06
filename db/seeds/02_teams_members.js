const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  await knex('team_members').del();
  await knex('teams').del();

  const roles = await knex('roles').select('id', 'name');
  const editorRole = roles.find(r => r.name === 'editor');
  const viewerRole = roles.find(r => r.name === 'viewer');
  const adminRole = roles.find(r => r.name === 'admin');

  const users = await knex('users').select('id', 'email');
  const alice = users.find(u => u.email === 'alice@atlas.local');
  const bob = users.find(u => u.email === 'bob@atlas.local');
  const carol = users.find(u => u.email === 'carol@atlas.local');
  const diana = users.find(u => u.email === 'diana@atlas.local');
  const erik = users.find(u => u.email === 'erik@atlas.local');
  const frank = users.find(u => u.email === 'frank@atlas.local');

  const platformTeamId = uuidv4();
  const supportTeamId = uuidv4();
  const securityTeamId = uuidv4();
  const devopsTeamId = uuidv4();
  const qaTeamId = uuidv4();

  await knex('teams').insert([
    { id: platformTeamId, name: 'Platform Engineering', description: 'Core platform and infrastructure', type: 'functional', ownershipScope: 'global', status: 'active', roleId: editorRole?.id, managerId: alice?.id, leadId: bob?.id },
    { id: supportTeamId, name: 'IT Support', description: 'End-user and service desk support', type: 'functional', ownershipScope: 'regional', status: 'active', roleId: viewerRole?.id, managerId: bob?.id, leadId: carol?.id },
    { id: securityTeamId, name: 'Security Team', description: 'Information security and compliance', type: 'functional', ownershipScope: 'global', status: 'active', roleId: adminRole?.id, managerId: alice?.id, leadId: diana?.id },
    { id: devopsTeamId, name: 'DevOps Team', description: 'CI/CD pipelines and cloud infrastructure', type: 'functional', ownershipScope: 'global', status: 'active', roleId: editorRole?.id, managerId: bob?.id, leadId: frank?.id },
    { id: qaTeamId, name: 'QA Team', description: 'Quality assurance and test automation', type: 'functional', ownershipScope: 'global', status: 'active', roleId: viewerRole?.id, managerId: carol?.id, leadId: erik?.id },
  ]);

  await knex('team_members').insert([
    { id: uuidv4(), teamId: platformTeamId, userId: bob.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: platformTeamId, userId: alice.id, memberRole: 'Member' },
    { id: uuidv4(), teamId: platformTeamId, userId: diana.id, memberRole: 'Member' },
    { id: uuidv4(), teamId: supportTeamId, userId: carol.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: securityTeamId, userId: alice.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: securityTeamId, userId: frank.id, memberRole: 'Member' },
    { id: uuidv4(), teamId: devopsTeamId, userId: erik.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: devopsTeamId, userId: diana.id, memberRole: 'Member' },
    { id: uuidv4(), teamId: qaTeamId, userId: frank.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: qaTeamId, userId: bob.id, memberRole: 'Member' },
  ]);
};
