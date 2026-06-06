const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  await knex('technical_services').del();
  await knex('business_services').del();
  await knex('service_base').del();

  const teams = await knex('teams').select('id', 'name');
  const platformTeam = teams.find(t => t.name === 'Platform Engineering');
  const itSupport = teams.find(t => t.name === 'IT Support');
  const devopsTeam = teams.find(t => t.name === 'DevOps Team');
  const securityTeam = teams.find(t => t.name === 'Security Team');

  // Business services (6)
  const bs = [
    { id: uuidv4(), name: 'Customer Portal', description: 'Customer-facing web portal for account management and orders', ownerTeamId: platformTeam?.id, classification: 'critical', businessCriticality: 'high', businessOwner: 'Product Team', serviceTier: 'tier-1' },
    { id: uuidv4(), name: 'HR Portal', description: 'Employee self-service and onboarding platform', ownerTeamId: itSupport?.id, classification: 'confidential', businessCriticality: 'medium', businessOwner: 'HR Team', serviceTier: 'tier-2' },
    { id: uuidv4(), name: 'eCommerce Platform', description: 'Online shop and checkout for JYSK retail products', ownerTeamId: platformTeam?.id, classification: 'critical', businessCriticality: 'critical', businessOwner: 'E-Commerce', serviceTier: 'tier-1' },
    { id: uuidv4(), name: 'Inventory Management', description: 'Real-time stock tracking across all warehouse and stores', ownerTeamId: devopsTeam?.id, classification: 'critical', businessCriticality: 'critical', businessOwner: 'Supply Chain', serviceTier: 'tier-1' },
    { id: uuidv4(), name: 'Customer Loyalty System', description: 'JYSK loyalty points, rewards, and member tiers', ownerTeamId: platformTeam?.id, classification: 'confidential', businessCriticality: 'medium', businessOwner: 'Marketing', serviceTier: 'tier-2' },
    { id: uuidv4(), name: 'Mobile App Backend', description: 'API backend for JYSK mobile shopping app (iOS/Android)', ownerTeamId: devopsTeam?.id, classification: 'critical', businessCriticality: 'high', businessOwner: 'Digital Products', serviceTier: 'tier-1' },
  ];

  // Technical services (6)
  const ts = [
    { id: uuidv4(), name: 'Authentication Service', description: 'Centralized auth, SSO, and identity management', ownerTeamId: platformTeam?.id, classification: 'critical', supportModel: '24x7', serviceCategory: 'Platform' },
    { id: uuidv4(), name: 'Email Service', description: 'Transactional and marketing email delivery', ownerTeamId: platformTeam?.id, classification: 'internal', supportModel: 'business_hours', serviceCategory: 'Communication' },
    { id: uuidv4(), name: 'Monitoring Platform', description: 'Infrastructure and application observability with alerting', ownerTeamId: platformTeam?.id, classification: 'internal', supportModel: '24x7', serviceCategory: 'Observability' },
    { id: uuidv4(), name: 'Payment Gateway', description: 'Card processing and 3D Secure via Klarna/Stripe integrations', ownerTeamId: securityTeam?.id, classification: 'critical', supportModel: '24x7', serviceCategory: 'Finance' },
    { id: uuidv4(), name: 'Warehouse Management', description: 'WMS for inbound/outbound logistics at 3 distribution centers', ownerTeamId: devopsTeam?.id, classification: 'critical', supportModel: '24x7', serviceCategory: 'Logistics' },
    { id: uuidv4(), name: 'Analytics & Reporting', description: 'Business intelligence, sales dashboards, and data warehouse', ownerTeamId: devopsTeam?.id, classification: 'confidential', supportModel: 'business_hours', serviceCategory: 'Data' },
  ];

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
