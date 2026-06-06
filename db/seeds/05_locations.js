const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  await knex('locations').del();

  const denmarkId = uuidv4();
  const swedenId = uuidv4();
  const germanyId = uuidv4();
  const dcId = uuidv4();
  const aarhusId = uuidv4();
  const osloId = uuidv4();
  const stockholmId = uuidv4();
  const berlinId = uuidv4();
  const secondaryDcId = uuidv4();

  await knex('locations').insert([
    // Countries
    { id: denmarkId, name: 'Denmark', description: 'Headquarters', type: 'Country', status: 'active', latitude: 56.2639, longitude: 9.5018, city: 'Brabrand', country: 'Denmark' },
    { id: swedenId, name: 'Sweden', description: 'Nordic operations hub', type: 'Country', status: 'active', latitude: 59.3293, longitude: 18.0686, city: 'Stockholm', country: 'Sweden' },
    { id: germanyId, name: 'Germany', description: 'Central European operations', type: 'Country', status: 'active', latitude: 51.1657, longitude: 10.4515, city: 'Flensburg', country: 'Germany' },
    // Denmark children
    { id: dcId, name: 'Primary Data Center', description: 'Main hosting facility', type: 'Data Center', parentLocationId: denmarkId, status: 'active', latitude: 55.6761, longitude: 12.5683, streetAddress: 'Lyskær 8', city: 'Herlev', postalCode: '2730', country: 'Denmark' },
    { id: aarhusId, name: 'Aarhus Office', description: 'JYSK headquarters and regional office', type: 'Office', parentLocationId: denmarkId, status: 'active', latitude: 56.1629, longitude: 10.2039, streetAddress: 'Søren Nymarks Vej 15', city: 'Brabrand', postalCode: '8220', country: 'Denmark' },
    // Sweden children
    { id: stockholmId, name: 'Stockholm Office', description: 'Nordic headquarters', type: 'Office', parentLocationId: swedenId, status: 'active', latitude: 59.3293, longitude: 18.0686, streetAddress: 'Lindhagensgatan 76', city: 'Stockholm', postalCode: '112 18', country: 'Sweden' },
    // Germany children
    { id: berlinId, name: 'Berlin Office', description: 'Central European hub', type: 'Office', parentLocationId: germanyId, status: 'active', latitude: 52.5200, longitude: 13.4050, streetAddress: 'Kurfürstendamm 194', city: 'Berlin', postalCode: '10707', country: 'Germany' },
    { id: secondaryDcId, name: 'Secondary Data Center', description: 'Disaster recovery and failover site', type: 'Data Center', parentLocationId: germanyId, status: 'active', latitude: 48.1351, longitude: 11.5820, streetAddress: 'Landsberger Str. 155', city: 'Munich', postalCode: '80687', country: 'Germany' },
    // Cross-region (Oslo under Denmark)
    { id: osloId, name: 'Oslo Office', description: 'Nordic regional hub', type: 'Office', parentLocationId: denmarkId, status: 'active', latitude: 59.9139, longitude: 10.7522, streetAddress: 'Dronning Eufemias gate 6', city: 'Oslo', postalCode: '0191', country: 'Norway' },
  ]);
};
