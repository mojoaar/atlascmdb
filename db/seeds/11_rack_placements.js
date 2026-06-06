const { v4: uuidv4 } = require('uuid');

function makeRng(seed) {
  let s = seed || 42;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

exports.seed = async function (knex) {
  await knex('rack_placements').del();

  const cis = await knex('ci_base')
    .join('cis', 'ci_base.id', 'cis.ciBaseId')
    .select('ci_base.id', 'ci_base.name', 'cis.ciType', 'cis.rackSize');

  const r = (name) => cis.find(c => c.name === name);

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

  const placedCiIds = new Set();
  const rows = [];

  for (const p of placements) {
    const rackCi = r(p.rack);
    const targetCi = r(p.ci);
    if (rackCi && targetCi) {
      placedCiIds.add(targetCi.id);
      rows.push({
        id: uuidv4(),
        rackId: rackCi.id,
        ciId: targetCi.id,
        startU: p.startU,
        occupiedUs: p.occupiedUs,
        position: p.position,
        label: p.label || null,
      });
    }
  }

  // Programmatically place other generated CIs in RACK-C-01, RACK-D-01, RACK-E-02, RACK-F-01
  const extraRacks = cis.filter(c => c.ciType === 'rack' && !['RACK-A-01', 'RACK-B-02'].includes(c.name));
  const unplacedCis = cis.filter(c => c.ciType !== 'rack' && !placedCiIds.has(c.id));

  const rng = makeRng(111);

  // Distribute unplaced CIs into extra racks
  let ciIdx = 0;
  for (const rack of extraRacks) {
    const size = rack.rackSize || 42;
    let currentU = size - 1; // start near top

    while (currentU > 4 && ciIdx < unplacedCis.length) {
      const target = unplacedCis[ciIdx++];
      const height = rng() < 0.2 ? 1 : 2; // 1U or 2U
      
      rows.push({
        id: uuidv4(),
        rackId: rack.id,
        ciId: target.id,
        startU: currentU - height + 1,
        occupiedUs: height,
        position: rng() < 0.85 ? 'front' : 'back',
        label: null,
      });

      currentU -= (height + 1); // leave 1U gap
    }
  }

  if (rows.length) await knex('rack_placements').insert(rows);
};
