const { v4: uuidv4 } = require('uuid');

function makeRng(seed) {
  let s = seed || 42;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

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

  const teamList = [
    { id: platformTeamId, name: 'Platform Engineering', description: 'Core platform and infrastructure', type: 'functional', ownershipScope: 'global', status: 'active', roleId: editorRole?.id, managerId: alice?.id, leadId: bob?.id },
    { id: supportTeamId, name: 'IT Support', description: 'End-user and service desk support', type: 'functional', ownershipScope: 'regional', status: 'active', roleId: viewerRole?.id, managerId: bob?.id, leadId: carol?.id },
    { id: securityTeamId, name: 'Security Team', description: 'Information security and compliance', type: 'functional', ownershipScope: 'global', status: 'active', roleId: adminRole?.id, managerId: alice?.id, leadId: diana?.id },
    { id: devopsTeamId, name: 'DevOps Team', description: 'CI/CD pipelines and cloud infrastructure', type: 'functional', ownershipScope: 'global', status: 'active', roleId: editorRole?.id, managerId: bob?.id, leadId: frank?.id },
    { id: qaTeamId, name: 'QA Team', description: 'Quality assurance and test automation', type: 'functional', ownershipScope: 'global', status: 'active', roleId: viewerRole?.id, managerId: carol?.id, leadId: erik?.id },
  ];

  const extraTeamNames = [
    { name: 'Database Administration', desc: 'Database provisioning, optimization and health', type: 'functional', scope: 'global' },
    { name: 'Network Operations', desc: 'Enterprise connectivity and core routers/switches', type: 'functional', scope: 'regional' },
    { name: 'Software Engineering', desc: 'Development of core customer-facing features', type: 'hierarchical', scope: 'global' },
    { name: 'Enterprise Architecture', desc: 'System blueprints and architectural guidance', type: 'matrix', scope: 'global' },
    { name: 'Customer Experience', desc: 'User experience design and testing', type: 'matrix', scope: 'regional' },
    { name: 'Product Management', desc: 'Roadmap planning and feature prioritization', type: 'hierarchical', scope: 'global' },
    { name: 'Analytics Team', desc: 'Data warehouse and reporting metrics', type: 'functional', scope: 'regional' },
    { name: 'Infrastructure Ops', desc: 'Physical server operations and maintenance', type: 'functional', scope: 'local' },
    { name: 'Cloud Security', desc: 'Cloud posture management and cloud compliance', type: 'matrix', scope: 'global' },
    { name: 'Site Reliability Engineering', desc: 'System availability, incident response and alerts', type: 'functional', scope: 'global' }
  ];

  const rng = makeRng(102);

  // Add extra teams to reach exactly 15 teams
  for (const t of extraTeamNames) {
    const manager = users[Math.floor(rng() * users.length)];
    const lead = users[Math.floor(rng() * users.length)];
    const roleId = rng() < 0.2 ? adminRole?.id : rng() < 0.7 ? editorRole?.id : viewerRole?.id;

    // parent team could be Platform Engineering or Security Team with 30% probability
    const parentTeamId = rng() < 0.3 ? (rng() < 0.5 ? platformTeamId : securityTeamId) : null;

    teamList.push({
      id: uuidv4(),
      name: t.name,
      description: t.desc,
      type: t.type,
      ownershipScope: t.scope,
      status: 'active',
      roleId,
      managerId: manager.id,
      leadId: lead.id,
      parentTeamId,
    });
  }

  await knex('teams').insert(teamList);

  const teamMembers = [];
  // Ensure we cover the original mappings first so existing assumptions/tests are happy
  teamMembers.push(
    { id: uuidv4(), teamId: platformTeamId, userId: bob.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: platformTeamId, userId: alice.id, memberRole: 'Member' },
    { id: uuidv4(), teamId: platformTeamId, userId: diana.id, memberRole: 'Member' },
    { id: uuidv4(), teamId: supportTeamId, userId: carol.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: securityTeamId, userId: alice.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: securityTeamId, userId: frank.id, memberRole: 'Member' },
    { id: uuidv4(), teamId: devopsTeamId, userId: erik.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: devopsTeamId, userId: diana.id, memberRole: 'Member' },
    { id: uuidv4(), teamId: qaTeamId, userId: frank.id, memberRole: 'Lead' },
    { id: uuidv4(), teamId: qaTeamId, userId: bob.id, memberRole: 'Member' }
  );

  // For each of the 15 teams, make sure they have a Lead and 1-4 members
  const memberSet = new Set(teamMembers.map(m => `${m.teamId}-${m.userId}`));
  
  for (const team of teamList) {
    // Check if team already has a lead
    const hasLead = teamMembers.some(m => m.teamId === team.id && m.memberRole === 'Lead');
    if (!hasLead) {
      const leadUser = users.find(u => u.id === team.leadId) || users[Math.floor(rng() * users.length)];
      const key = `${team.id}-${leadUser.id}`;
      if (!memberSet.has(key)) {
        memberSet.add(key);
        teamMembers.push({
          id: uuidv4(),
          teamId: team.id,
          userId: leadUser.id,
          memberRole: 'Lead'
        });
      }
    }

    // Add 1-4 random members
    const numMembers = Math.floor(rng() * 4) + 1;
    for (let m = 0; m < numMembers; m++) {
      const user = users[Math.floor(rng() * users.length)];
      const key = `${team.id}-${user.id}`;
      if (!memberSet.has(key)) {
        memberSet.add(key);
        teamMembers.push({
          id: uuidv4(),
          teamId: team.id,
          userId: user.id,
          memberRole: 'Member'
        });
      }
    }
  }

  await knex('team_members').insert(teamMembers);
};
