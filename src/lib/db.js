import knexBuilder from 'knex';
import config from '../../db/knexfile';

const env = process.env.TEST_DB === 'true' ? 'test' : (process.env.NODE_ENV || 'development');

// Ensure PostgreSQL numeric columns (like cost, latitude, longitude) are parsed as numbers instead of strings
if (typeof window === 'undefined') {
  try {
    const pg = require('pg');
    pg.types.setTypeParser(1700, parseFloat);
  } catch (e) {
    // pg might not be loaded in all environments
  }
}

let knexInstance = null;

function getDb() {
  if (!knexInstance) {
    knexInstance = knexBuilder(config[env]);
  }
  return knexInstance;
}

export function resetDb() {
  knexInstance = null;
}

export default getDb;
