const { v4: uuidv4 } = require('uuid');

function makeRng(seed) {
  let s = seed || 42;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

exports.seed = async function (knex) {
  await knex('applications').del();
  await knex('application_base').del();

  const teams = await knex('teams').select('id', 'name');
  const platformTeam = teams.find(t => t.name === 'Platform Engineering');
  const devopsTeam = teams.find(t => t.name === 'DevOps Team');

  const atlasBaseId = uuidv4();
  const employeePortalId = uuidv4();
  const monitorDashboardId = uuidv4();
  const posTerminalId = uuidv4();
  const mobileShoppingId = uuidv4();
  const storeManagerId = uuidv4();
  const logisticsPortalId = uuidv4();
  const supplierPortalId = uuidv4();

  const baseApps = [
    { id: atlasBaseId, name: 'Atlas CMDB', description: 'Configuration management database', ownerTeamId: platformTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '0.2.0', classification: 'internal', appType: 'Web Application', technologyStack: 'Next.js, Node.js, PostgreSQL' },
    { id: employeePortalId, name: 'Employee Portal', description: 'Internal company intranet and tools hub', ownerTeamId: platformTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '2.3.0', classification: 'internal', appType: 'Web Application', technologyStack: 'React, Node.js, PostgreSQL' },
    { id: monitorDashboardId, name: 'Monitoring Dashboard', description: 'Real-time system and application health views', ownerTeamId: platformTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'Open Source', version: '10.4.0', classification: 'internal', appType: 'Web Application', technologyStack: 'Grafana, Prometheus' },
    { id: posTerminalId, name: 'POS Terminal App', description: 'Point-of-sale application for 2,800+ JYSK stores', ownerTeamId: devopsTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '5.1.0', classification: 'critical', appType: 'Desktop Application', technologyStack: 'Electron, React, Node.js' },
    { id: mobileShoppingId, name: 'Mobile Shopping App', description: 'Customer-facing iOS and Android shopping application', ownerTeamId: devopsTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '3.2.1', classification: 'critical', appType: 'Mobile Application', technologyStack: 'React Native, GraphQL, Node.js' },
    { id: storeManagerId, name: 'Store Manager Dashboard', description: 'Sales tracking, staffing, and inventory for store managers', ownerTeamId: devopsTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '2.0.0', classification: 'internal', appType: 'Web Application', technologyStack: 'Angular, .NET Core, SQL Server' },
    { id: logisticsPortalId, name: 'Logistics Portal', description: 'Shipment tracking and distribution center operations', ownerTeamId: devopsTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '1.8.0', classification: 'internal', appType: 'Web Application', technologyStack: 'Vue.js, Java Spring Boot, PostgreSQL' },
    { id: supplierPortalId, name: 'Supplier Portal', description: 'Vendor onboarding, order management, and invoice processing', ownerTeamId: platformTeam?.id, lifecycleStatus: 'production', environment: 'production', vendor: 'In-House', version: '2.1.0', classification: 'confidential', appType: 'Web Application', technologyStack: 'Next.js, PostgreSQL, Redis' },
  ];

  const rng = makeRng(104);

  const extraApps = [
    { name: 'BI Analytics Hub', desc: 'Enterprise data visualization and report rendering platform', vendor: 'Snowflake', version: '4.2.0', class: 'internal', type: 'Web Application', tech: 'Tableau, Snowflake, React' },
    { name: 'CRM Client App', desc: 'Customer relationship tracking and pipeline visualization client', vendor: 'Salesforce', version: '12.1.1', class: 'confidential', type: 'Desktop Application', tech: 'Salesforce APIs, React, Electron' },
    { name: 'Corporate Email Hub', desc: 'Central corporate communication and scheduling dashboard', vendor: 'Microsoft', version: '16.5.0', class: 'internal', type: 'Web Application', tech: 'Exchange Online, React, C#' },
    { name: 'Inventory Mobile App', desc: 'Warehouse scanning and bin-mapping handheld app', vendor: 'In-House', version: '1.1.2', class: 'critical', type: 'Mobile Application', tech: 'Swift, Kotlin, Spring Boot' },
    { name: 'Procurement Portal', desc: 'Purchase requisition and vendor bidding portal', vendor: 'In-House', version: '3.0.1', class: 'confidential', type: 'Web Application', tech: 'React, Node.js, DynamoDB' },
    { name: 'Payroll Engine', desc: 'Automatic payroll calculations and tax filing pipeline', vendor: 'Oracle', version: '8.4.2', class: 'confidential', type: 'Desktop Application', tech: 'Java, Spring, Oracle DB' },
    { name: 'Marketing Planner', desc: 'Campaign scheduling and budget tracking tool', vendor: 'In-House', version: '2.1.0', class: 'internal', type: 'Web Application', tech: 'Vue.js, Python, PostgreSQL' },
    { name: 'Facility Scheduler', desc: 'Conference room and visitor parking scheduler', vendor: 'In-House', version: '1.5.0', class: 'internal', type: 'Web Application', tech: 'Svelte, Go, SQLite' },
    { name: 'Security Scanner App', desc: 'Local daemon scanning systems for common vulnerabilities', vendor: 'Open Source', version: '7.0.0', class: 'internal', type: 'Desktop Application', tech: 'C++, Rust' },
    { name: 'Feedback Collector', desc: 'Customer feedback survey collection app in retail stores', vendor: 'In-House', version: '2.4.0', class: 'internal', type: 'Mobile Application', tech: 'Flutter, Firebase, Node.js' },
    { name: 'Catalog Builder', desc: 'Product imagery and description catalog editor', vendor: 'In-House', version: '4.1.0', class: 'internal', type: 'Web Application', tech: 'Next.js, Tailwind, GraphQL' },
    { name: 'Auditing Tracker', desc: 'Internal audits, SOC2 controls, and compliance tracker', vendor: 'In-House', version: '1.2.0', class: 'confidential', type: 'Web Application', tech: 'Ruby on Rails, PostgreSQL' },
  ];

  for (const a of extraApps) {
    const team = teams[Math.floor(rng() * teams.length)];
    baseApps.push({
      id: uuidv4(),
      name: a.name,
      description: a.desc,
      ownerTeamId: team.id,
      lifecycleStatus: 'production',
      environment: 'production',
      vendor: a.vendor,
      version: a.version,
      classification: a.class,
      appType: a.type,
      technologyStack: a.tech,
    });
  }

  await knex('application_base').insert(
    baseApps.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      ownerTeamId: a.ownerTeamId,
      lifecycleStatus: a.lifecycleStatus,
      environment: a.environment,
      vendor: a.vendor,
      version: a.version,
      classification: a.classification,
    }))
  );

  await knex('applications').insert(
    baseApps.map(a => ({
      id: uuidv4(),
      applicationBaseId: a.id,
      appType: a.appType,
      technologyStack: a.technologyStack,
    }))
  );
};
