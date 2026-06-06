exports.seed = async function (knex) {
  await knex('assets').del();

  const cis = await knex('ci_base').select('id', 'name');
  const ciMap = {};
  for (const c of cis) ciMap[c.name] = c.id;

  const locations = await knex('locations').select('id', 'name');
  const locMap = {};
  for (const l of locations) locMap[l.name] = l.id;

  const users = await knex('users').select('id', 'email');
  const userMap = {};
  for (const u of users) userMap[u.email] = u.id;

  const assets = [];

  // Hardware (8)
  assets.push({ name: 'Dell PowerEdge R650', assetTag: 'HW-2024-001', ciName: 'prod-web-01', category: 'hardware', model: 'PowerEdge R650', status: 'in_use', user: 'bob@atlas.local', location: 'Primary Data Center', supplier: 'Dell Technologies', purchaseDate: '2024-01-15', warrantyExpiry: '2027-01-15', cost: 12450.00, notes: 'Primary production web server hardware' });
  assets.push({ name: 'Dell PowerEdge R750xs', assetTag: 'HW-2024-002', ciName: 'prod-web-02', category: 'hardware', model: 'PowerEdge R750xs', status: 'in_use', user: 'diana@atlas.local', location: 'Primary Data Center', supplier: 'Dell Technologies', purchaseDate: '2024-03-01', warrantyExpiry: '2027-03-01', cost: 18900.00, notes: 'Production web server node 2' });
  assets.push({ name: 'Dell PowerEdge R650 (Ecom)', assetTag: 'HW-2024-003', ciName: 'web-shop-01', category: 'hardware', model: 'PowerEdge R650', status: 'in_use', user: 'erik@atlas.local', location: 'Primary Data Center', supplier: 'Dell Technologies', purchaseDate: '2024-02-01', warrantyExpiry: '2027-02-01', cost: 12450.00, notes: 'eCommerce web server node 1' });
  assets.push({ name: 'Dell PowerEdge R650 (Ecom 2)', assetTag: 'HW-2024-004', ciName: 'web-shop-02', category: 'hardware', model: 'PowerEdge R650', status: 'in_use', user: 'erik@atlas.local', location: 'Primary Data Center', supplier: 'Dell Technologies', purchaseDate: '2024-02-01', warrantyExpiry: '2027-02-01', cost: 12450.00, notes: 'eCommerce web server node 2' });
  assets.push({ name: 'Dell PowerEdge R760', assetTag: 'HW-2024-005', ciName: 'db-prod-01', category: 'hardware', model: 'PowerEdge R760', status: 'in_use', user: null, location: 'Primary Data Center', supplier: 'Dell Technologies', purchaseDate: '2024-01-10', warrantyExpiry: '2027-01-10', cost: 28900.00, notes: 'Database server — 128GB RAM, NVMe storage' });
  assets.push({ name: 'Dell PowerEdge R750 (DR)', assetTag: 'HW-2024-006', ciName: 'db-warehouse-01', category: 'hardware', model: 'PowerEdge R750', status: 'in_use', user: 'frank@atlas.local', location: 'Secondary Data Center', supplier: 'Dell Technologies', purchaseDate: '2024-03-15', warrantyExpiry: '2027-03-15', cost: 21900.00, notes: 'Data warehouse server at DR site' });
  assets.push({ name: 'HPE ProLiant DL380 Gen11', assetTag: 'HW-2024-007', ciName: 'cache-prod-01', category: 'hardware', model: 'ProLiant DL380', status: 'in_use', user: null, location: 'Primary Data Center', supplier: 'Hewlett Packard Enterprise', purchaseDate: '2024-04-01', warrantyExpiry: '2027-04-01', cost: 15700.00, notes: 'Redis cache cluster node' });
  assets.push({ name: 'HPE ProLiant DL380 Gen11 (MQ)', assetTag: 'HW-2024-008', ciName: 'mq-prod-01', category: 'hardware', model: 'ProLiant DL380', status: 'in_use', user: null, location: 'Primary Data Center', supplier: 'Hewlett Packard Enterprise', purchaseDate: '2024-04-01', warrantyExpiry: '2027-04-01', cost: 15700.00, notes: 'Message queue broker' });

  // Network (4)
  assets.push({ name: 'Cisco Catalyst 9300', assetTag: 'NW-2024-001', ciName: 'core-sw-01', category: 'network', model: 'Catalyst 9300-48P', status: 'in_use', user: 'erik@atlas.local', location: 'Primary Data Center', supplier: 'Cisco Systems', purchaseDate: '2024-02-10', warrantyExpiry: '2029-02-10', cost: 8750.00, notes: 'Core switch — 48-port PoE+' });
  assets.push({ name: 'Cisco Catalyst 9300 (Secondary)', assetTag: 'NW-2024-002', ciName: 'db-warehouse-01', category: 'network', model: 'Catalyst 9300-24P', status: 'in_use', user: null, location: 'Secondary Data Center', supplier: 'Cisco Systems', purchaseDate: '2024-03-20', warrantyExpiry: '2029-03-20', cost: 6200.00, notes: 'Secondary site switch — 24-port PoE+' });
  assets.push({ name: 'Palo Alto PA-450', assetTag: 'NW-2024-003', ciName: null, category: 'network', model: 'PA-450', status: 'in_use', user: null, location: 'Primary Data Center', supplier: 'Palo Alto Networks', purchaseDate: '2024-01-05', warrantyExpiry: '2027-01-05', cost: 18900.00, notes: 'Next-gen firewall appliance' });
  assets.push({ name: 'Palo Alto PA-450 (DR)', assetTag: 'NW-2024-004', ciName: null, category: 'network', model: 'PA-450', status: 'in_stock', user: null, location: 'Secondary Data Center', supplier: 'Palo Alto Networks', purchaseDate: '2024-03-20', warrantyExpiry: '2027-03-20', cost: 18900.00, notes: 'DR firewall — cold standby' });

  // Licenses (4)
  assets.push({ name: 'Windows Server 2022 License', assetTag: 'SW-2024-001', ciName: 'prod-web-01', category: 'license', model: 'Windows Server 2022 Datacenter', status: 'in_use', user: null, location: null, supplier: 'Microsoft', purchaseDate: '2024-01-20', warrantyExpiry: null, cost: 6155.00, notes: 'Per-core licensing, 16 cores' });
  assets.push({ name: 'SQL Server 2022 License', assetTag: 'SW-2024-002', ciName: 'db-prod-01', category: 'license', model: 'SQL Server 2022 Enterprise', status: 'in_use', user: null, location: null, supplier: 'Microsoft', purchaseDate: '2024-04-01', warrantyExpiry: null, cost: 15250.00, notes: 'Enterprise edition, 4 cores' });
  assets.push({ name: 'VMware vSphere 8 License', assetTag: 'SW-2024-003', ciName: null, category: 'license', model: 'vSphere 8 Enterprise Plus', status: 'in_use', user: null, location: null, supplier: 'VMware by Broadcom', purchaseDate: '2024-01-10', warrantyExpiry: null, cost: 18800.00, notes: '3-year term, 8 CPU licenses' });
  assets.push({ name: 'Adobe Creative Cloud License', assetTag: 'SW-2024-004', ciName: null, category: 'license', model: 'Creative Cloud for Teams', status: 'in_use', user: 'carol@atlas.local', location: null, supplier: 'Adobe', purchaseDate: '2024-03-01', warrantyExpiry: null, cost: 1050.00, notes: 'Annual subscription, marketing team' });

  // Other (4)
  assets.push({ name: 'APC Smart-UPS 3000', assetTag: 'PW-2024-001', ciName: 'core-sw-01', category: 'hardware', model: 'Smart-UPS SRT 3000VA', status: 'in_use', user: null, location: 'Primary Data Center', supplier: 'APC by Schneider Electric', purchaseDate: '2024-01-10', warrantyExpiry: '2026-01-10', cost: 3200.00, notes: 'Rack-mounted UPS' });
  assets.push({ name: 'APC Smart-UPS 3000 (Rack 2)', assetTag: 'PW-2024-002', ciName: null, category: 'hardware', model: 'Smart-UPS SRT 3000VA', status: 'in_stock', user: null, location: 'Primary Data Center', supplier: 'APC by Schneider Electric', purchaseDate: '2024-04-01', warrantyExpiry: '2027-04-01', cost: 3200.00, notes: 'Spare UPS for rack expansion' });
  assets.push({ name: 'Synology RS3621xs+', assetTag: 'ST-2024-001', ciName: null, category: 'hardware', model: 'RS3621xs+', status: 'in_use', user: null, location: 'Primary Data Center', supplier: 'Synology', purchaseDate: '2024-01-25', warrantyExpiry: '2027-01-25', cost: 8900.00, notes: 'NAS storage — 48TB usable, backups' });
  assets.push({ name: 'Dell PowerEdge R750 (Cold)', assetTag: 'HW-2024-009', ciName: null, category: 'hardware', model: 'PowerEdge R750xs', status: 'in_stock', user: null, location: 'Oslo Office', supplier: 'Dell Technologies', purchaseDate: '2024-04-15', warrantyExpiry: '2027-04-15', cost: 14800.00, notes: 'Cold standby — ready for provisioning' });

  // Total generator with deterministic IDs
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    const num = String(i + 1).padStart(3, '0');
    const id = `a0000001-${num}01-4000-8000-00000000000${num}`.slice(0, 36);
    await knex('assets').insert({
      id,
      name: a.name,
      assetTag: a.assetTag,
      ciId: a.ciName ? ciMap[a.ciName] : null,
      category: a.category,
      model: a.model,
      status: a.status,
      assignedTo: a.user ? userMap[a.user] : null,
      locationId: a.location ? locMap[a.location] : null,
      supplier: a.supplier,
      purchaseDate: a.purchaseDate,
      warrantyExpiry: a.warrantyExpiry,
      cost: a.cost,
      notes: a.notes,
    });
  }
};
