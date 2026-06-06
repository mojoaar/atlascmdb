const { v4: uuidv4 } = require('uuid');

function makeRng(seed) {
  let s = seed || 42;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

exports.seed = async function (knex) {
  await knex('technical_services').del();
  await knex('business_services').del();
  await knex('service_base').del();

  const teams = await knex('teams').select('id', 'name');
  const platformTeam = teams.find(t => t.name === 'Platform Engineering');
  const itSupport = teams.find(t => t.name === 'IT Support');
  const devopsTeam = teams.find(t => t.name === 'DevOps Team');
  const securityTeam = teams.find(t => t.name === 'Security Team');

  // Business services (6 original)
  const bs = [
    { id: uuidv4(), name: 'Customer Portal', description: 'Customer-facing web portal for account management and orders', ownerTeamId: platformTeam?.id, classification: 'critical', businessCriticality: 'high', businessOwner: 'Product Team', serviceTier: 'tier-1' },
    { id: uuidv4(), name: 'HR Portal', description: 'Employee self-service and onboarding platform', ownerTeamId: itSupport?.id, classification: 'confidential', businessCriticality: 'medium', businessOwner: 'HR Team', serviceTier: 'tier-2' },
    { id: uuidv4(), name: 'eCommerce Platform', description: 'Online shop and checkout for JYSK retail products', ownerTeamId: platformTeam?.id, classification: 'critical', businessCriticality: 'critical', businessOwner: 'E-Commerce', serviceTier: 'tier-1' },
    { id: uuidv4(), name: 'Inventory Management', description: 'Real-time stock tracking across all warehouse and stores', ownerTeamId: devopsTeam?.id, classification: 'critical', businessCriticality: 'critical', businessOwner: 'Supply Chain', serviceTier: 'tier-1' },
    { id: uuidv4(), name: 'Customer Loyalty System', description: 'JYSK loyalty points, rewards, and member tiers', ownerTeamId: platformTeam?.id, classification: 'confidential', businessCriticality: 'medium', businessOwner: 'Marketing', serviceTier: 'tier-2' },
    { id: uuidv4(), name: 'Mobile App Backend', description: 'API backend for JYSK mobile shopping app (iOS/Android)', ownerTeamId: devopsTeam?.id, classification: 'critical', businessCriticality: 'high', businessOwner: 'Digital Products', serviceTier: 'tier-1' },
  ];

  // Technical services (6 original)
  const ts = [
    { id: uuidv4(), name: 'Authentication Service', description: 'Centralized auth, SSO, and identity management', ownerTeamId: platformTeam?.id, classification: 'critical', supportModel: '24x7', serviceCategory: 'Platform' },
    { id: uuidv4(), name: 'Email Service', description: 'Transactional and marketing email delivery', ownerTeamId: platformTeam?.id, classification: 'internal', supportModel: 'business_hours', serviceCategory: 'Communication' },
    { id: uuidv4(), name: 'Monitoring Platform', description: 'Infrastructure and application observability with alerting', ownerTeamId: platformTeam?.id, classification: 'internal', supportModel: '24x7', serviceCategory: 'Observability' },
    { id: uuidv4(), name: 'Payment Gateway', description: 'Card processing and 3D Secure via Klarna/Stripe integrations', ownerTeamId: securityTeam?.id, classification: 'critical', supportModel: '24x7', serviceCategory: 'Finance' },
    { id: uuidv4(), name: 'Warehouse Management', description: 'WMS for inbound/outbound logistics at 3 distribution centers', ownerTeamId: devopsTeam?.id, classification: 'critical', supportModel: '24x7', serviceCategory: 'Logistics' },
    { id: uuidv4(), name: 'Analytics & Reporting', description: 'Business intelligence, sales dashboards, and data warehouse', ownerTeamId: devopsTeam?.id, classification: 'confidential', supportModel: 'business_hours', serviceCategory: 'Data' },
  ];

  const rng = makeRng(103);

  // Add 4 more business services to make 10 total
  const extraBs = [
    { name: 'Store POS System', desc: 'Point of Sale system across all retail locations', classification: 'critical', criticality: 'critical', owner: 'Retail Ops', tier: 'tier-1' },
    { name: 'Customer Support Ticketing', desc: 'Help desk and customer support resolution software', classification: 'internal', criticality: 'medium', owner: 'Customer Support', tier: 'tier-2' },
    { name: 'Gift Card Processor', desc: 'Issuing and redeeming JYSK gift cards across channels', classification: 'critical', criticality: 'high', owner: 'Finance Tech', tier: 'tier-1' },
    { name: 'B2B Sales Portal', desc: 'Wholesale and corporate client bulk order web portal', classification: 'internal', criticality: 'medium', owner: 'B2B Sales', tier: 'tier-2' },
  ];

  for (const b of extraBs) {
    const team = teams[Math.floor(rng() * teams.length)];
    bs.push({
      id: uuidv4(),
      name: b.name,
      description: b.desc,
      ownerTeamId: team.id,
      classification: b.classification,
      businessCriticality: b.criticality,
      businessOwner: b.owner,
      serviceTier: b.tier,
    });
  }

  // Add 4 more technical services to make 10 total
  const extraTs = [
    { name: 'Kubernetes Engine', desc: 'Container orchestration and cluster hosting management', classification: 'critical', model: '24x7', category: 'Platform' },
    { name: 'Data Streaming Bus', desc: 'Kafka-based high-throughput event streaming architecture', classification: 'critical', model: '24x7', category: 'Data' },
    { name: 'Content Delivery Network', desc: 'Global edge assets delivery and DDoS protection layers', classification: 'internal', model: '24x7', category: 'Network' },
    { name: 'Relational DB Cluster', desc: 'Primary PostgreSQL high-availability active-passive cluster management', classification: 'critical', model: '24x7', category: 'Database' },
  ];

  for (const t of extraTs) {
    const team = teams[Math.floor(rng() * teams.length)];
    ts.push({
      id: uuidv4(),
      name: t.name,
      description: t.desc,
      ownerTeamId: team.id,
      classification: t.classification,
      supportModel: t.model,
      serviceCategory: t.category,
    });
  }

  await knex('service_base').insert([
    ...bs.map(b => ({ id: b.id, name: b.name, description: b.description, ownerTeamId: b.ownerTeamId, lifecycleStatus: 'production', environment: 'production', classification: b.classification })),
    ...ts.map(t => ({ id: t.id, name: t.name, description: t.description, ownerTeamId: t.ownerTeamId, lifecycleStatus: 'production', environment: 'production', classification: t.classification })),
  ]);

  await knex('business_services').insert(
    bs.map(b => ({ id: uuidv4(), serviceBaseId: b.id, businessCriticality: b.businessCriticality, businessOwner: b.businessOwner, serviceTier: b.serviceTier }))
  );

  await knex('technical_services').insert(
    ts.map(t => ({ id: uuidv4(), serviceBaseId: t.id, supportModel: t.supportModel, serviceCategory: t.serviceCategory }))
  );
};
