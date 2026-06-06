const knex = require('knex');
const config = require('./knexfile');
const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';
const db = knex(config[env]);

async function setup() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Running migrations (${env})...`);
  await db.migrate.latest();
  console.log('Migrations complete.');

  console.log('Running seeds...');
  await db.seed.run();
  console.log('Seeds complete.');

  await db.destroy();
  console.log('Database ready.');
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
