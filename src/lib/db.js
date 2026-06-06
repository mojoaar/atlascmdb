import knexBuilder from 'knex';
import config from '../../db/knexfile';

const env = process.env.TEST_DB === 'true' ? 'test' : (process.env.NODE_ENV || 'development');

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
