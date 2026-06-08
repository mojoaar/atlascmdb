const path = require('path');

// Safe dotenv loading supporting all cwd situations (including Knex CLI directory switching)
require('dotenv').config();
const cwd = process.cwd();
if (cwd.endsWith('/db') || cwd.endsWith('\\db')) {
  require('dotenv').config({ path: path.join(cwd, '../.env') });
}
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {}

const knex = require('knex');
const config = require('./knexfile');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';
const db = knex(config[env]);

async function init() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Running migrations (${env})...`);
  await db.migrate.latest();
  console.log('Migrations complete.');

  console.log('Seeding admin user and roles...');
  await db.seed.run({ specific: '01_users_roles.js' });
  console.log('Seed complete.');

  await db.destroy();
  console.log('Database ready. Login: alice@atlas.local / password123');
}

init().catch((err) => {
  console.error('Init failed:', err);
  process.exit(1);
});
