const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  await knex('rack_placements').del();

  const cis = await knex('ci_base').select('id', 'name');

  const r = (name) => cis.find(c => c.name === name)?.id;

  const placements = [
    { rack: 'RACK-A-01', ci: 'prod-web-01',   startU: 41, occupiedUs: 2, position: 'front' },
    { rack: 'RACK-A-01', ci: 'prod-web-02',   startU: 39, occupiedUs: 2, position: 'front' },
    { rack: 'RACK-A-01', ci: 'core-sw-01',    startU: 38, occupiedUs: 1, position: 'back',  label: 'Core Switch' },
    { rack: 'RACK-A-01', ci: 'lb-prod-01',    startU: 36, occupiedUs: 2, position: 'front' },
    { rack: 'RACK-A-01', ci: 'cache-prod-01', startU: 35, occupiedUs: 1, position: 'front' },

    { rack: 'RACK-B-02', ci: 'web-shop-01',   startU: 47, occupiedUs: 2, position: 'front' },
    { rack: 'RACK-B-02', ci: 'web-shop-02',   startU: 45, occupiedUs: 2, position: 'front' },
    { rack: 'RACK-B-02', ci: 'lb-web-01',     startU: 43, occupiedUs: 1, position: 'front' },
    { rack: 'RACK-B-02', ci: 'mq-prod-01',    startU: 41, occupiedUs: 2, position: 'front' },
    { rack: 'RACK-B-02', ci: 'db-prod-01',    startU: 39, occupiedUs: 2, position: 'front' },

    { rack: 'RACK-C-01', ci: 'db-warehouse-01', startU: 41, occupiedUs: 1, position: 'front' },
  ];

  const rows = placements
    .map(p => {
      const rackId = r(p.rack);
      const ciId = r(p.ci);
      if (!rackId || !ciId) return null;
      return {
        id: uuidv4(),
        rackId,
        ciId,
        startU: p.startU,
        occupiedUs: p.occupiedUs,
        position: p.position,
        label: p.label || null,
      };
    })
    .filter(Boolean);

  if (rows.length) await knex('rack_placements').insert(rows);
};
