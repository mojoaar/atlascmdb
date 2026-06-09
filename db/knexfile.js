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

// Safe path resolvers that handle Knex CLI switching working directory to db/
function getDatabasePath(dbName) {
  const cwd = process.cwd();
  if (cwd.endsWith('/db') || cwd.endsWith('\\db')) {
    return path.join(cwd, '..', 'data', dbName);
  }
  return path.join(cwd, 'data', dbName);
}

function getMigrationsPath() {
  const cwd = process.cwd();
  if (cwd.endsWith('/db') || cwd.endsWith('\\db')) {
    return path.join(cwd, 'migrations');
  }
  return path.join(cwd, 'db', 'migrations');
}

function getSeedsPath() {
  const cwd = process.cwd();
  if (cwd.endsWith('/db') || cwd.endsWith('\\db')) {
    return path.join(cwd, 'seeds');
  }
  return path.join(cwd, 'db', 'seeds');
}

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: getDatabasePath('atlas.db'),
    },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 1,
      afterCreate: (conn, cb) => {
        conn.pragma('journal_mode = WAL');
        conn.pragma('foreign_keys = ON');
        cb();
      },
    },
    migrations: {
      directory: getMigrationsPath(),
    },
    seeds: {
      directory: getSeedsPath(),
    },
  },
  test: {
    client: 'better-sqlite3',
    connection: {
      filename: getDatabasePath('test.db'),
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.pragma('journal_mode = WAL');
        conn.pragma('foreign_keys = ON');
        cb();
      },
    },
    migrations: {
      directory: getMigrationsPath(),
    },
    seeds: {
      directory: getSeedsPath(),
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    useNullAsDefault: true,
    migrations: {
      directory: getMigrationsPath(),
    },
    seeds: {
      directory: getSeedsPath(),
    },
  },
};
