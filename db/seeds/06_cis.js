const { v4: uuidv4 } = require('uuid');

function makeRng(seed) {
  let s = seed || 42;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

exports.seed = async function (knex) {
  await knex('cis').del();
  await knex('ci_base').del();

  const teams = await knex('teams').select('id', 'name');
  const locations = await knex('locations').select('id', 'name', 'type');
  const platformTeam = teams.find(t => t.name === 'Platform Engineering');
  const devopsTeam = teams.find(t => t.name === 'DevOps Team');
  const dcLocation = locations.find(l => l.name === 'Primary Data Center');
  const secondaryDc = locations.find(l => l.name === 'Secondary Data Center');

  const cIs = [];

  // 12 Original Infrastructure CIs
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'prod-web-01', desc: 'Production web server (Node.js)', type: 'Server', serial: 'SN-2024-0001' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'prod-web-02', desc: 'Production web server (Node.js)', type: 'Server', serial: 'SN-2024-0006' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'web-shop-01', desc: 'eCommerce web server (Nginx + PHP)', type: 'Server', serial: 'SN-2024-0007' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'web-shop-02', desc: 'eCommerce web server (Nginx + PHP)', type: 'Server', serial: 'SN-2024-0008' });

  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'db-prod-01', desc: 'Primary PostgreSQL database server', type: 'Database', serial: 'SN-2024-0002' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'db-warehouse-01', desc: 'Data warehouse (PostgreSQL Analytical)', type: 'Database', serial: 'SN-2024-0009' });

  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'lb-prod-01', desc: 'Production load balancer (HAProxy)', type: 'Network Device', serial: 'SN-2024-0003' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'lb-web-01', desc: 'Web tier load balancer (HAProxy)', type: 'Network Device', serial: 'SN-2024-0010' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'k8s-prod-01', desc: 'Production Kubernetes cluster', type: 'Container', serial: 'SN-2024-0004' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'core-sw-01', desc: 'Core network switch', type: 'Network Device', serial: 'SN-2024-0005' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'cache-prod-01', desc: 'Redis cache cluster', type: 'Server', serial: 'SN-2024-0011' });
  cIs.push({ baseId: uuidv4(), childId: uuidv4(), name: 'mq-prod-01', desc: 'RabbitMQ message queue', type: 'Server', serial: 'SN-2024-0012' });

  // 6 Racks total (3 original + 3 new)
  const racks = [
    { name: 'RACK-A-01', desc: 'Primary rack — web + core infra', size: 42, model: 'APC NetShelter SX 42U' },
    { name: 'RACK-B-02', desc: 'Primary rack — shop + database', size: 48, model: 'APC NetShelter SV 48U' },
    { name: 'RACK-C-01', desc: 'DR rack at Secondary Data Center', size: 42, model: 'APC NetShelter SX 42U' },
    { name: 'RACK-D-01', desc: 'Expansion rack — backup + secondary services', size: 42, model: 'APC NetShelter SX 42U' },
    { name: 'RACK-E-02', desc: 'Enterprise database rack', size: 48, model: 'APC NetShelter SV 48U' },
    { name: 'RACK-F-01', desc: 'Dev/Test rack with virtualized hosts', size: 42, model: 'APC NetShelter SX 42U' },
  ];

  const rackIds = [];
  for (const r of racks) {
    const baseId = uuidv4();
    const childId = uuidv4();
    rackIds.push(baseId);
    cIs.push({
      baseId,
      childId,
      name: r.name,
      desc: r.desc,
      type: 'rack',
      serial: `RK-2024-000${cIs.length + 1}`,
      rackSize: r.size,
      rackModel: r.model
    });
  }

  const rng = makeRng(106);

  // Generate 62 extra infrastructure CIs to reach exactly 80 total CIs (74 infra + 6 racks)
  const extraTypes = [
    { type: 'Server', desc: 'Application host Node.js / Python cluster' },
    { type: 'Database', desc: 'High availability read replica database node' },
    { type: 'Network Device', desc: 'Edge access switch / edge firewall' },
    { type: 'Container', desc: 'Docker swarm supervisor host node' },
    { type: 'Storage', desc: 'SAN/NAS central network storage partition' },
    { type: 'Other', desc: 'Localized hardware utility appliance' },
  ];

  const dcLocations = locations.filter(l => l.type === 'Data Center' || l.type === 'Office');

  while (cIs.length < 80) {
    const t = extraTypes[Math.floor(rng() * extraTypes.length)];
    const countOfType = cIs.filter(c => c.type === t.type).length + 1;
    const name = `${t.type.toLowerCase().replace(' ', '-')}-${String(countOfType).padStart(2, '0')}`;
    
    cIs.push({
      baseId: uuidv4(),
      childId: uuidv4(),
      name,
      desc: `${t.type} node supporting business apps - cluster tier ${countOfType}`,
      type: t.type,
      serial: `SN-2024-${String(100 + cIs.length).padStart(4, '0')}`
    });
  }

  await knex('ci_base').insert(
    cIs.map((c, i) => {
      let locationId = dcLocation?.id;
      if (c.name === 'RACK-C-01' || c.name.includes('warehouse')) {
        locationId = secondaryDc?.id;
      } else if (dcLocations.length > 0) {
        locationId = dcLocations[Math.floor(rng() * dcLocations.length)].id;
      }

      const team = teams[Math.floor(rng() * teams.length)];

      return {
        id: c.baseId,
        name: c.name,
        description: c.desc,
        ownerTeamId: team.id,
        locationId,
        lifecycleStatus: c.type === 'rack' ? 'active' : 'production',
        environment: 'production',
        classification: c.type === 'rack' ? 'infrastructure' : rng() < 0.3 ? 'critical' : 'internal',
        externalRef: `SRV-${String(i + 1).padStart(3, '0')}`,
      };
    })
  );

  await knex('cis').insert(
    cIs.map((c, i) => ({
      id: c.childId,
      ciBaseId: c.baseId,
      ciType: c.type,
      serialNumber: c.serial,
      assetTag: `AT-${String(1001 + i).padStart(4, '0')}`,
      ...(c.type === 'rack' ? {
        rackSize: c.rackSize,
        rackModel: c.rackModel,
      } : {}),
    }))
  );
};
