const { v4: uuidv4 } = require('uuid');

function makeRng(seed) {
  let s = seed || 42;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

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

  const locations = [
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
  ];

  const rng = makeRng(105);

  const extraCountries = [
    { id: uuidv4(), name: 'United Kingdom', description: 'UK operations', type: 'Country', status: 'active', latitude: 55.3781, longitude: -3.4360, city: 'London', country: 'United Kingdom' },
    { id: uuidv4(), name: 'United States', description: 'North American operations', type: 'Country', status: 'active', latitude: 37.0902, longitude: -95.7129, city: 'Chicago', country: 'United States' },
    { id: uuidv4(), name: 'France', description: 'Western European operations', type: 'Country', status: 'active', latitude: 46.2276, longitude: 2.2137, city: 'Paris', country: 'France' },
    { id: uuidv4(), name: 'Netherlands', description: 'Benelux operations', type: 'Country', status: 'active', latitude: 52.1326, longitude: 5.2913, city: 'Amsterdam', country: 'Netherlands' },
    { id: uuidv4(), name: 'Spain', description: 'Southern European operations', type: 'Country', status: 'active', latitude: 40.4637, longitude: -3.7492, city: 'Madrid', country: 'Spain' },
  ];

  locations.push(...extraCountries);

  const parentPool = [denmarkId, swedenId, germanyId, ...extraCountries.map(c => c.id)];

  const cityPool = [
    { name: 'London', street: '100 Victoria St', zip: 'SW1E 5JL', lat: 51.4991, lng: -0.1398, country: 'United Kingdom' },
    { name: 'Manchester', street: '42 Deansgate', zip: 'M3 1WY', lat: 53.4808, lng: -2.2426, country: 'United Kingdom' },
    { name: 'Edinburgh', street: '15 Princes St', zip: 'EH2 2AN', lat: 55.9533, lng: -3.1883, country: 'United Kingdom' },
    { name: 'New York', street: '120 Broadway', zip: '10271', lat: 40.7074, lng: -74.0112, country: 'United States' },
    { name: 'Chicago', street: '233 S Wacker Dr', zip: '60606', lat: 41.8789, lng: -87.6358, country: 'United States' },
    { name: 'San Francisco', street: '101 California St', zip: '94111', lat: 37.7937, lng: -122.3999, country: 'United States' },
    { name: 'Paris', street: '12 Rue de la Paix', zip: '75002', lat: 48.8698, lng: 2.3308, country: 'France' },
    { name: 'Lyon', street: '85 Rue de la République', zip: '69002', lat: 45.7578, lng: 4.8320, country: 'France' },
    { name: 'Amsterdam', street: 'Keizersgracht 421', zip: '1016 EK', lat: 52.3676, lng: 4.8904, country: 'Netherlands' },
    { name: 'Rotterdam', street: 'Coolsingel 104', zip: '3012 AG', lat: 51.9244, lng: 4.4777, country: 'Netherlands' },
    { name: 'Madrid', street: 'Calle de Alcalá 14', zip: '28014', lat: 40.4189, lng: -3.6993, country: 'Spain' },
    { name: 'Barcelona', street: 'Passeig de Gràcia 50', zip: '08007', lat: 41.3917, lng: 2.1649, country: 'Spain' },
    { name: 'Copenhagen', street: 'Rådhuspladsen 1', zip: '1550', lat: 55.6761, lng: 12.5683, country: 'Denmark' },
    { name: 'Gothenburg', street: 'Avenyn 18', zip: '411 36', lat: 57.7089, lng: 11.9746, country: 'Sweden' },
    { name: 'Munich', street: 'Marienplatz 8', zip: '80331', lat: 48.1351, lng: 11.5820, country: 'Germany' },
    { name: 'Hamburg', street: 'Jungfernstieg 12', zip: '20354', lat: 53.5511, lng: 9.9937, country: 'Germany' },
    { name: 'Frankfurt', street: 'Zeil 85', zip: '60313', lat: 50.1109, lng: 8.6821, country: 'Germany' },
  ];

  const types = ['Office', 'Data Center', 'Warehouse', 'Hub'];

  while (locations.length < 40) {
    const city = cityPool[Math.floor(rng() * cityPool.length)];
    const type = types[Math.floor(rng() * types.length)];
    const parentId = parentPool[Math.floor(rng() * parentPool.length)];
    
    // Add small random noise to lat/lng so coordinates are slightly unique for child nodes
    const lat = city.lat + (rng() - 0.5) * 0.1;
    const lng = city.lng + (rng() - 0.5) * 0.1;
    
    const countOfType = locations.filter(l => l.type === type).length + 1;
    const name = `${city.name} ${type} ${countOfType}`;

    locations.push({
      id: uuidv4(),
      name,
      description: `${type} location servicing ${city.country} operations`,
      type,
      parentLocationId: parentId,
      status: 'active',
      latitude: lat,
      longitude: lng,
      streetAddress: city.street,
      city: city.name,
      postalCode: city.zip,
      country: city.country,
    });
  }

  await knex('locations').insert(locations);
};
