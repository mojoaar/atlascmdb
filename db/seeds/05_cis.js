const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  await knex('cis').del();
  await knex('ci_base').del();

  const teams = await knex('teams').select('id', 'name');
  const locations = await knex('locations').select('id', 'name');
  const platformTeam = teams.find(t => t.name === 'Platform Engineering');
  const devopsTeam = teams.find(t => t.name === 'DevOps Team');
  const dcLocation = locations.find(l => l.name === 'Primary Data Center');
  const secondaryDc = locations.find(l => l.name === 'Secondary Data Center');

  // === CONFIGURATION ITEMS (12) ===
  const cIs = [];

  // Web servers
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'prod-web-01', desc: 'Production web server (Node.js)', type: 'Server', serial: 'SN-2024-0001' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'prod-web-02', desc: 'Production web server (Node.js)', type: 'Server', serial: 'SN-2024-0006' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'web-shop-01', desc: 'eCommerce web server (Nginx + PHP)', type: 'Server', serial: 'SN-2024-0007' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'web-shop-02', desc: 'eCommerce web server (Nginx + PHP)', type: 'Server', serial: 'SN-2024-0008' });

  // Databases
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'db-prod-01', desc: 'Primary PostgreSQL database server', type: 'Database', serial: 'SN-2024-0002' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'db-warehouse-01', desc: 'Data warehouse (PostgreSQL Analytical)', type: 'Database', serial: 'SN-2024-0009' });

  // Infrastructure
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'lb-prod-01', desc: 'Production load balancer (HAProxy)', type: 'Network Device', serial: 'SN-2024-0003' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'lb-web-01', desc: 'Web tier load balancer (HAProxy)', type: 'Network Device', serial: 'SN-2024-0010' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'k8s-prod-01', desc: 'Production Kubernetes cluster', type: 'Container', serial: 'SN-2024-0004' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'core-sw-01', desc: 'Core network switch', type: 'Network Device', serial: 'SN-2024-0005' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'cache-prod-01', desc: 'Redis cache cluster', type: 'Server', serial: 'SN-2024-0011' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'mq-prod-01', desc: 'RabbitMQ message queue', type: 'Server', serial: 'SN-2024-0012' });

  await knex('ci_base').insert(
    cIs.map((c, i) => ({
      id: c.baseId,
      name: c.name,
      description: c.desc,
      ownerTeamId: i >= 8 ? devopsTeam?.id : platformTeam?.id,
      locationId: c.name.includes('warehouse') ? secondaryDc?.id : dcLocation?.id,
      lifecycleStatus: 'production',
      environment: 'production',
      classification: c.name.includes('shop') || c.name.includes('web') ? 'critical' : 'internal',
      externalRef: `SRV-${String(i + 1).padStart(3, '0')}`,
    }))
  );

  await knex('cis').insert(
    cIs.map((c, i) => ({
      id: c.childId,
      ciBaseId: c.baseId,
      ciType: c.type,
      serialNumber: c.serial,
      assetTag: `AT-${String(1001 + i).padStart(4, '0')}`,
    }))
  );
};
