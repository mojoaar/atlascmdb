const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  await knex('applications').del();
  await knex('application_base').del();

  const teams = await knex('teams').select('id', 'name');
  const platformTeam = teams.find(t => t.name === 'Platform Engineering');
  const devopsTeam = teams.find(t => t.name === 'DevOps Team');

  // === APPLICATIONS (8) ===
  const atlasBaseId = uuidv4();
  const employeePortalId = uuidv4();
  const monitorDashboardId = uuidv4();
  const posTerminalId = uuidv4();
  const mobileShoppingId = uuidv4();
  const storeManagerId = uuidv4();
  const logisticsPortalId = uuidv4();
  const supplierPortalId = uuidv4();

  await knex('application_base').insert([
    { id: atlasBaseId, name: 'Atlas CMDB', description: 'Configuration management database', ownerTeamId: platformTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '0.2.0', classification: 'internal' },
    { id: employeePortalId, name: 'Employee Portal', description: 'Internal company intranet and tools hub', ownerTeamId: platformTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '2.3.0', classification: 'internal' },
    { id: monitorDashboardId, name: 'Monitoring Dashboard', description: 'Real-time system and application health views', ownerTeamId: platformTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'Open Source', version: '10.4.0', classification: 'internal' },
    { id: posTerminalId, name: 'POS Terminal App', description: 'Point-of-sale application for 2,800+ JYSK stores', ownerTeamId: devopsTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '5.1.0', classification: 'critical' },
    { id: mobileShoppingId, name: 'Mobile Shopping App', description: 'Customer-facing iOS and Android shopping application', ownerTeamId: devopsTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '3.2.1', classification: 'critical' },
    { id: storeManagerId, name: 'Store Manager Dashboard', description: 'Sales tracking, staffing, and inventory for store managers', ownerTeamId: devopsTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '2.0.0', classification: 'internal' },
    { id: logisticsPortalId, name: 'Logistics Portal', description: 'Shipment tracking and distribution center operations', ownerTeamId: devopsTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '1.8.0', classification: 'internal' },
    { id: supplierPortalId, name: 'Supplier Portal', description: 'Vendor onboarding, order management, and invoice processing', ownerTeamId: platformTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '2.1.0', classification: 'confidential' },
  ]);

  await knex('applications').insert([
    { id: uuidv4(), applicationBaseId: atlasBaseId, appType: 'Web Application', technologyStack: 'Next.js, Node.js, PostgreSQL' },
    { id: uuidv4(), applicationBaseId: employeePortalId, appType: 'Web Application', technologyStack: 'React, Node.js, PostgreSQL' },
    { id: uuidv4(), applicationBaseId: monitorDashboardId, appType: 'Web Application', technologyStack: 'Grafana, Prometheus' },
    { id: uuidv4(), applicationBaseId: posTerminalId, appType: 'Desktop Application', technologyStack: 'Electron, React, Node.js' },
    { id: uuidv4(), applicationBaseId: mobileShoppingId, appType: 'Mobile Application', technologyStack: 'React Native, GraphQL, Node.js' },
    { id: uuidv4(), applicationBaseId: storeManagerId, appType: 'Web Application', technologyStack: 'Angular, .NET Core, SQL Server' },
    { id: uuidv4(), applicationBaseId: logisticsPortalId, appType: 'Web Application', technologyStack: 'Vue.js, Java Spring Boot, PostgreSQL' },
    { id: uuidv4(), applicationBaseId: supplierPortalId, appType: 'Web Application', technologyStack: 'Next.js, PostgreSQL, Redis' },
  ]);
};
