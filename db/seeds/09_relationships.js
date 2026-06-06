const { v4: uuidv4 } = require('uuid');

function makeRng(seed) {
  let s = seed || 42;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

exports.seed = async function (knex) {
  await knex('relationships').del();

  const services = await knex('service_base').select('id', 'name');
  const applications = await knex('application_base').select('id', 'name');
  const cis = await knex('ci_base').select('id', 'name');
  const teams = await knex('teams').select('id', 'name');
  const locations = await knex('locations').select('id', 'name');
  const assets = await knex('assets').select('id', 'assetTag', 'ciId');

  const svc = (name) => services.find(s => s.name === name)?.id;
  const app = (name) => applications.find(a => a.name === name)?.id;
  const ci = (name) => cis.find(c => c.name === name)?.id;
  const tm = (name) => teams.find(t => t.name === name)?.id;
  const loc = (name) => locations.find(l => l.name === name)?.id;
  const ast = (tag) => assets.find(a => a.assetTag === tag)?.id;

  const rels = [
    ['service', svc('Customer Portal'), 'service', svc('Authentication Service'), 'depends_on', 'outbound', 'Portal relies on Auth Service for login'],
    ['service', svc('Customer Portal'), 'service', svc('Email Service'), 'depends_on', 'outbound', 'Portal sends transactional emails via Email Service'],
    ['service', svc('Email Service'), 'service', svc('Authentication Service'), 'depends_on', 'outbound', 'Email Service uses Auth for SMTP auth'],
    ['service', svc('eCommerce Platform'), 'service', svc('Payment Gateway'), 'depends_on', 'outbound', 'Checkout depends on Payment Gateway'],
    ['service', svc('eCommerce Platform'), 'service', svc('Inventory Management'), 'depends_on', 'outbound', 'Stock check on product pages via Inventory'],
    ['service', svc('eCommerce Platform'), 'service', svc('Authentication Service'), 'depends_on', 'outbound', 'Customer login uses Auth Service'],
    ['service', svc('eCommerce Platform'), 'service', svc('Email Service'), 'depends_on', 'outbound', 'Order confirmations via Email Service'],
    ['service', svc('Mobile App Backend'), 'service', svc('Authentication Service'), 'depends_on', 'outbound', 'Mobile auth uses central Auth Service'],
    ['service', svc('Mobile App Backend'), 'service', svc('Payment Gateway'), 'depends_on', 'outbound', 'In-app purchases via Payment Gateway'],
    ['service', svc('Mobile App Backend'), 'service', svc('eCommerce Platform'), 'depends_on', 'outbound', 'Mobile API proxies to eCommerce for catalog'],
    ['service', svc('Customer Loyalty System'), 'service', svc('eCommerce Platform'), 'depends_on', 'outbound', 'Points earned at checkout via eCommerce'],
    ['service', svc('Customer Loyalty System'), 'service', svc('Email Service'), 'depends_on', 'outbound', 'Reward emails via Email Service'],
    ['service', svc('Inventory Management'), 'service', svc('Warehouse Management'), 'depends_on', 'outbound', 'Stock sync with warehouse system'],
    ['service', svc('Analytics & Reporting'), 'service', svc('eCommerce Platform'), 'depends_on', 'outbound', 'Sales data pipeline from eCommerce'],
    ['service', svc('Analytics & Reporting'), 'service', svc('Inventory Management'), 'depends_on', 'outbound', 'Inventory KPIs from Inventory system'],
    ['service', svc('Monitoring Platform'), 'service', svc('eCommerce Platform'), 'uses', 'outbound', 'Monitors eCommerce health and latency'],
    ['service', svc('Monitoring Platform'), 'service', svc('Payment Gateway'), 'uses', 'outbound', 'Monitors payment transaction success rate'],

    ['service', svc('Authentication Service'), 'application', app('Atlas CMDB'), 'uses', 'outbound', 'Auth stores config in Atlas CMDB'],
    ['service', svc('Monitoring Platform'), 'application', app('Atlas CMDB'), 'uses', 'outbound', 'Monitoring reads service topology from CMDB'],
    ['service', svc('Monitoring Platform'), 'application', app('Monitoring Dashboard'), 'uses', 'outbound', 'Monitoring data visualized through Dashboard'],
    ['service', svc('eCommerce Platform'), 'application', app('Mobile Shopping App'), 'uses', 'outbound', 'Backend serves mobile app'],
    ['service', svc('Mobile App Backend'), 'application', app('Mobile Shopping App'), 'uses', 'outbound', 'Mobile app uses dedicated API backend'],
    ['service', svc('Inventory Management'), 'application', app('Store Manager Dashboard'), 'uses', 'outbound', 'Store dashboard shows inventory levels'],
    ['service', svc('Inventory Management'), 'application', app('POS Terminal App'), 'uses', 'outbound', 'POS checks real-time stock'],
    ['service', svc('Inventory Management'), 'application', app('Logistics Portal'), 'uses', 'outbound', 'Logistics tracks stock movement'],
    ['service', svc('Warehouse Management'), 'application', app('Logistics Portal'), 'uses', 'outbound', 'WMS backend for logistics portal'],
    ['service', svc('eCommerce Platform'), 'application', app('Supplier Portal'), 'uses', 'outbound', 'Supplier catalog feeds into eCommerce'],
    ['application', app('Employee Portal'), 'service', svc('Authentication Service'), 'depends_on', 'outbound', 'Employee Portal SSO via Auth Service'],

    ['application', app('Atlas CMDB'), 'ci', ci('prod-web-01'), 'hosted_on', 'outbound', 'Atlas CMDB runs on prod-web-01'],
    ['application', app('Employee Portal'), 'ci', ci('prod-web-02'), 'hosted_on', 'outbound', 'Employee Portal runs on prod-web-02'],
    ['application', app('Monitoring Dashboard'), 'ci', ci('prod-web-01'), 'hosted_on', 'outbound', 'Monitoring Dashboard on prod-web-01'],
    ['application', app('Atlas CMDB'), 'ci', ci('db-prod-01'), 'hosted_on', 'outbound', 'Atlas CMDB database on db-prod-01'],
    ['application', app('POS Terminal App'), 'ci', ci('prod-web-02'), 'hosted_on', 'outbound', 'POS backend on prod-web-02'],
    ['application', app('Mobile Shopping App'), 'ci', ci('web-shop-01'), 'hosted_on', 'outbound', 'Mobile app API on web-shop-01'],
    ['application', app('Mobile Shopping App'), 'ci', ci('web-shop-02'), 'hosted_on', 'outbound', 'Mobile app API on web-shop-02 (HA)'],
    ['application', app('Store Manager Dashboard'), 'ci', ci('prod-web-02'), 'hosted_on', 'outbound', 'Store Manager backend on prod-web-02'],
    ['application', app('Logistics Portal'), 'ci', ci('prod-web-01'), 'hosted_on', 'outbound', 'Logistics app on prod-web-01'],
    ['application', app('Supplier Portal'), 'ci', ci('prod-web-02'), 'hosted_on', 'outbound', 'Supplier Portal on prod-web-02'],
    // Fixed: 'Analytics & Reporting' is a service, not an application!
    ['service', svc('Analytics & Reporting'), 'ci', ci('db-warehouse-01'), 'hosted_on', 'outbound', 'Analytics queries run on warehouse DB'],

    ['ci', ci('prod-web-01'), 'ci', ci('db-prod-01'), 'depends_on', 'outbound', 'Web server connects to database backend'],
    ['ci', ci('prod-web-02'), 'ci', ci('db-prod-01'), 'depends_on', 'outbound', 'Web server connects to database backend'],
    ['ci', ci('web-shop-01'), 'ci', ci('cache-prod-01'), 'depends_on', 'outbound', 'Shop server uses Redis cache'],
    ['ci', ci('web-shop-02'), 'ci', ci('cache-prod-01'), 'depends_on', 'outbound', 'Shop server uses Redis cache'],
    ['ci', ci('prod-web-01'), 'ci', ci('lb-prod-01'), 'connects_to', 'outbound', 'Web server behind load balancer'],
    ['ci', ci('prod-web-02'), 'ci', ci('lb-prod-01'), 'connects_to', 'outbound', 'Web server behind load balancer'],
    ['ci', ci('web-shop-01'), 'ci', ci('lb-web-01'), 'connects_to', 'outbound', 'Shop server behind web LB'],
    ['ci', ci('web-shop-02'), 'ci', ci('lb-web-01'), 'connects_to', 'outbound', 'Shop server behind web LB'],
    ['ci', ci('prod-web-01'), 'ci', ci('k8s-prod-01'), 'part_of', 'outbound', 'Web server container in k8s cluster'],
    ['ci', ci('prod-web-02'), 'ci', ci('k8s-prod-01'), 'part_of', 'outbound', 'Web server container in k8s cluster'],
    ['ci', ci('cache-prod-01'), 'ci', ci('k8s-prod-01'), 'part_of', 'outbound', 'Redis runs as k8s statefulset'],
    ['ci', ci('mq-prod-01'), 'ci', ci('k8s-prod-01'), 'part_of', 'outbound', 'RabbitMQ runs in k8s'],
    ['ci', ci('core-sw-01'), 'ci', ci('lb-prod-01'), 'connects_to', 'outbound', 'Core switch uplinks to load balancer'],
    ['ci', ci('core-sw-01'), 'ci', ci('lb-web-01'), 'connects_to', 'outbound', 'Core switch uplinks to web load balancer'],

    // Rack placements
    ['ci', ci('prod-web-01'),   'ci', ci('RACK-A-01'), 'hosted_on', 'outbound', 'Web server in primary rack A'],
    ['ci', ci('prod-web-02'),   'ci', ci('RACK-A-01'), 'hosted_on', 'outbound', 'Web server in primary rack A'],
    ['ci', ci('core-sw-01'),    'ci', ci('RACK-A-01'), 'hosted_on', 'outbound', 'Core switch in primary rack A'],
    ['ci', ci('lb-prod-01'),    'ci', ci('RACK-A-01'), 'hosted_on', 'outbound', 'Load balancer in primary rack A'],
    ['ci', ci('cache-prod-01'), 'ci', ci('RACK-A-01'), 'hosted_on', 'outbound', 'Cache cluster in primary rack A'],
    ['ci', ci('web-shop-01'),   'ci', ci('RACK-B-02'), 'hosted_on', 'outbound', 'Shop server in rack B'],
    ['ci', ci('web-shop-02'),   'ci', ci('RACK-B-02'), 'hosted_on', 'outbound', 'Shop server in rack B'],
    ['ci', ci('lb-web-01'),     'ci', ci('RACK-B-02'), 'hosted_on', 'outbound', 'Web LB in rack B'],
    ['ci', ci('mq-prod-01'),    'ci', ci('RACK-B-02'), 'hosted_on', 'outbound', 'Message queue in rack B'],
    ['ci', ci('db-prod-01'),    'ci', ci('RACK-B-02'), 'hosted_on', 'outbound', 'Database in rack B'],
    ['ci', ci('db-warehouse-01'), 'ci', ci('RACK-C-01'), 'hosted_on', 'outbound', 'Warehouse DB at DR rack C'],

    ['ci', ci('prod-web-01'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Server physically in Primary DC'],
    ['ci', ci('prod-web-02'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Server physically in Primary DC'],
    ['ci', ci('db-prod-01'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Database in Primary DC'],
    ['ci', ci('core-sw-01'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Core switch in Primary DC'],
    ['ci', ci('lb-prod-01'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Load balancer in Primary DC'],
    ['ci', ci('k8s-prod-01'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'K8s cluster in Primary DC'],
    ['ci', ci('web-shop-01'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Shop server in Primary DC'],
    ['ci', ci('web-shop-02'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Shop server in Primary DC'],
    ['ci', ci('db-warehouse-01'), 'location', loc('Secondary Data Center'), 'part_of', 'outbound', 'Data warehouse at DR site'],
    ['ci', ci('cache-prod-01'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Cache cluster in Primary DC'],
    ['ci', ci('mq-prod-01'), 'location', loc('Primary Data Center'), 'part_of', 'outbound', 'Message queue in Primary DC'],

    ['location', loc('Primary Data Center'), 'location', loc('Secondary Data Center'), 'connects_to', 'bidirectional', 'Site-to-site VPN for DR replication'],
    ['location', loc('Primary Data Center'), 'location', loc('Aarhus Office'), 'connects_to', 'bidirectional', 'Primary DC linked to Aarhus via MPLS'],
    ['location', loc('Aarhus Office'), 'location', loc('Oslo Office'), 'connects_to', 'bidirectional', 'Nordic offices connected via VPN'],
    ['location', loc('Stockholm Office'), 'location', loc('Oslo Office'), 'connects_to', 'bidirectional', 'Scandinavian offices interconnected'],
    ['location', loc('Berlin Office'), 'location', loc('Secondary Data Center'), 'connects_to', 'bidirectional', 'Berlin office near DR data center'],

    ['team', tm('Platform Engineering'), 'service', svc('Customer Portal'), 'owned_by', 'inbound', 'Managed by Platform Engineering'],
    ['team', tm('Platform Engineering'), 'service', svc('Email Service'), 'owned_by', 'inbound', 'Managed by Platform Engineering'],
    ['team', tm('Platform Engineering'), 'service', svc('eCommerce Platform'), 'owned_by', 'inbound', 'Managed by Platform Engineering'],
    ['team', tm('Platform Engineering'), 'service', svc('Customer Loyalty System'), 'owned_by', 'inbound', 'Managed by Platform Engineering'],
    ['team', tm('Platform Engineering'), 'application', app('Atlas CMDB'), 'owned_by', 'inbound', 'Managed by Platform Engineering'],
    ['team', tm('Platform Engineering'), 'application', app('Employee Portal'), 'owned_by', 'inbound', 'Managed by Platform Engineering'],
    ['team', tm('Platform Engineering'), 'application', app('Supplier Portal'), 'owned_by', 'inbound', 'Managed by Platform Engineering'],
    ['team', tm('IT Support'), 'service', svc('Authentication Service'), 'owned_by', 'inbound', 'Auth managed by IT Support'],
    ['team', tm('IT Support'), 'service', svc('HR Portal'), 'owned_by', 'inbound', 'HR Portal managed by IT Support'],
    ['team', tm('IT Support'), 'application', app('Monitoring Dashboard'), 'owned_by', 'inbound', 'Dashboard managed by IT Support'],

    ['team', tm('Security Team'), 'service', svc('Authentication Service'), 'owned_by', 'inbound', 'Auth security audited by Security'],
    ['team', tm('Security Team'), 'service', svc('Payment Gateway'), 'owned_by', 'inbound', 'PCI compliance by Security Team'],
    ['team', tm('Security Team'), 'service', svc('Monitoring Platform'), 'owned_by', 'inbound', 'Monitoring overseen by Security'],
    ['team', tm('DevOps Team'), 'service', svc('Inventory Management'), 'owned_by', 'inbound', 'Inventory managed by DevOps'],
    ['team', tm('DevOps Team'), 'service', svc('Mobile App Backend'), 'owned_by', 'inbound', 'Mobile backend managed by DevOps'],
    ['team', tm('DevOps Team'), 'service', svc('Warehouse Management'), 'owned_by', 'inbound', 'WMS managed by DevOps'],
    ['team', tm('DevOps Team'), 'service', svc('Analytics & Reporting'), 'owned_by', 'inbound', 'Analytics managed by DevOps'],
    ['team', tm('DevOps Team'), 'application', app('POS Terminal App'), 'owned_by', 'inbound', 'POS app managed by DevOps'],
    ['team', tm('DevOps Team'), 'application', app('Mobile Shopping App'), 'owned_by', 'inbound', 'Mobile app managed by DevOps'],
    ['team', tm('DevOps Team'), 'application', app('Store Manager Dashboard'), 'owned_by', 'inbound', 'Store dashboard managed by DevOps'],
    ['team', tm('DevOps Team'), 'application', app('Logistics Portal'), 'owned_by', 'inbound', 'Logistics portal managed by DevOps'],
    ['team', tm('QA Team'), 'application', app('Mobile Shopping App'), 'owned_by', 'inbound', 'QA oversees mobile app testing'],

    ['asset', ast('HW-2024-001'), 'ci', ci('prod-web-01'), 'hosted_on', 'outbound', 'Dell R650 hosts prod-web-01'],
    ['asset', ast('HW-2024-002'), 'ci', ci('prod-web-02'), 'hosted_on', 'outbound', 'Dell R750xs hosts prod-web-02'],
    ['asset', ast('HW-2024-003'), 'ci', ci('web-shop-01'), 'hosted_on', 'outbound', 'Dell R650 hosts web-shop-01'],
    ['asset', ast('HW-2024-004'), 'ci', ci('web-shop-02'), 'hosted_on', 'outbound', 'Dell R650 hosts web-shop-02'],
    ['asset', ast('HW-2024-005'), 'ci', ci('db-prod-01'), 'hosted_on', 'outbound', 'Dell R760 hosts db-prod-01'],
    ['asset', ast('HW-2024-006'), 'ci', ci('db-warehouse-01'), 'hosted_on', 'outbound', 'Dell R750 hosts warehouse DB'],
    ['asset', ast('HW-2024-007'), 'ci', ci('cache-prod-01'), 'hosted_on', 'outbound', 'HPE DL380 hosts cache cluster'],
    ['asset', ast('HW-2024-008'), 'ci', ci('mq-prod-01'), 'hosted_on', 'outbound', 'HPE DL380 hosts message queue'],
    ['asset', ast('NW-2024-001'), 'ci', ci('core-sw-01'), 'hosted_on', 'outbound', 'Cisco Catalyst is core-sw-01'],
    ['asset', ast('NW-2024-002'), 'ci', ci('db-warehouse-01'), 'hosted_on', 'outbound', 'Cisco Catalyst at DR site for warehouse'],
    ['asset', ast('SW-2024-001'), 'ci', ci('prod-web-01'), 'part_of', 'outbound', 'Windows Server license for prod-web-01'],
    ['asset', ast('SW-2024-002'), 'ci', ci('db-prod-01'), 'part_of', 'outbound', 'SQL Server license for db-prod-01'],
    ['asset', ast('PW-2024-001'), 'ci', ci('core-sw-01'), 'part_of', 'outbound', 'UPS backup for core switch'],
  ];

  const inserts = rels.filter(r => r[1] && r[3]).map(([sourceType, sourceId, targetType, targetId, relationshipType, direction, notes]) => ({
    id: uuidv4(),
    sourceType,
    sourceId,
    targetType,
    targetId,
    relationshipType,
    direction,
    notes,
  }));

  // Programmatically generate extra relationships between the newly generated entities to form a rich web
  const rng = makeRng(109);

  // Link extra services together (depends_on)
  const extraServices = services.filter(s => !['Customer Portal', 'HR Portal', 'eCommerce Platform', 'Inventory Management', 'Customer Loyalty System', 'Mobile App Backend', 'Authentication Service', 'Email Service', 'Monitoring Platform', 'Payment Gateway', 'Warehouse Management', 'Analytics & Reporting'].includes(s.name));
  for (const es of extraServices) {
    const parentSvc = services[Math.floor(rng() * services.length)];
    if (parentSvc.id !== es.id) {
      inserts.push({
        id: uuidv4(),
        sourceType: 'service',
        sourceId: es.id,
        targetType: 'service',
        targetId: parentSvc.id,
        relationshipType: 'depends_on',
        direction: 'outbound',
        notes: `Dependency link between ${es.name} and ${parentSvc.name}`,
      });
    }
  }

  // Link extra applications (uses / hosted_on)
  const extraApps = applications.filter(a => !['Atlas CMDB', 'Employee Portal', 'Monitoring Dashboard', 'POS Terminal App', 'Mobile Shopping App', 'Store Manager Dashboard', 'Logistics Portal', 'Supplier Portal'].includes(a.name));
  const infraCis = cis.filter(c => c.name.includes('server') || c.name.includes('node') || c.name.includes('db') || c.name.includes('cache'));
  for (const ea of extraApps) {
    const parentSvc = services[Math.floor(rng() * services.length)];
    inserts.push({
      id: uuidv4(),
      sourceType: 'application',
      sourceId: ea.id,
      targetType: 'service',
      targetId: parentSvc.id,
      relationshipType: 'uses',
      direction: 'outbound',
      notes: `${ea.name} utilizes backend service ${parentSvc.name}`,
    });

    if (infraCis.length > 0) {
      const hostCi = infraCis[Math.floor(rng() * infraCis.length)];
      inserts.push({
        id: uuidv4(),
        sourceType: 'application',
        sourceId: ea.id,
        targetType: 'ci',
        targetId: hostCi.id,
        relationshipType: 'hosted_on',
        direction: 'outbound',
        notes: `${ea.name} runtime hosted on infrastructure node ${hostCi.name}`,
      });
    }
  }

  // Link extra CIs together (depends_on / part_of)
  const extraCis = cis.filter(c => !['prod-web-01', 'prod-web-02', 'web-shop-01', 'web-shop-02', 'db-prod-01', 'db-warehouse-01', 'lb-prod-01', 'lb-web-01', 'k8s-prod-01', 'core-sw-01', 'cache-prod-01', 'mq-prod-01', 'RACK-A-01', 'RACK-B-02', 'RACK-C-01', 'RACK-D-01', 'RACK-E-02', 'RACK-F-01'].includes(c.name));
  for (const ec of extraCis) {
    const targetCi = cis[Math.floor(rng() * cis.length)];
    if (targetCi.id !== ec.id) {
      inserts.push({
        id: uuidv4(),
        sourceType: 'ci',
        sourceId: ec.id,
        targetType: 'ci',
        targetId: targetCi.id,
        relationshipType: rng() < 0.5 ? 'depends_on' : 'connects_to',
        direction: 'outbound',
        notes: `Physical / logical link between ${ec.name} and ${targetCi.name}`,
      });
    }
  }

  // Link extra locations together (connects_to)
  const extraLocs = locations.filter(l => !['Denmark', 'Sweden', 'Germany', 'Primary Data Center', 'Aarhus Office', 'Stockholm Office', 'Berlin Office', 'Secondary Data Center', 'Oslo Office'].includes(l.name));
  for (const el of extraLocs) {
    const hubLoc = locations[Math.floor(rng() * locations.length)];
    if (hubLoc.id !== el.id) {
      inserts.push({
        id: uuidv4(),
        sourceType: 'location',
        sourceId: el.id,
        targetType: 'location',
        targetId: hubLoc.id,
        relationshipType: 'connects_to',
        direction: 'bidirectional',
        notes: `Network tunnel linking ${el.name} region and ${hubLoc.name}`,
      });
    }
  }

  // Link extra teams to services or apps (owned_by)
  const extraTeams = teams.filter(t => !['Platform Engineering', 'IT Support', 'Security Team', 'DevOps Team', 'QA Team'].includes(t.name));
  for (const et of extraTeams) {
    const sOrA = rng() < 0.5 ? { type: 'service', pool: services } : { type: 'application', pool: applications };
    const entity = sOrA.pool[Math.floor(rng() * sOrA.pool.length)];
    inserts.push({
      id: uuidv4(),
      sourceType: 'team',
      sourceId: et.id,
      targetType: sOrA.type,
      targetId: entity.id,
      relationshipType: 'owned_by',
      direction: 'inbound',
      notes: `${entity.name} ownership scope managed by functional group ${et.name}`,
    });
  }

  await knex('relationships').insert(inserts);
};
