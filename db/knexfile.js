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

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(process.cwd(), 'data', 'atlas.db'),
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
      directory: path.join(process.cwd(), 'db', 'migrations'),
    },
    seeds: {
      directory: path.join(process.cwd(), 'db', 'seeds'),
    },
  },
  test: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(process.cwd(), 'data', 'test.db'),
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
      directory: path.join(process.cwd(), 'db', 'migrations'),
    },
    seeds: {
      directory: path.join(process.cwd(), 'db', 'seeds'),
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    useNullAsDefault: true,
    migrations: {
      directory: path.join(process.cwd(), 'db', 'migrations'),
    },
    seeds: {
      directory: path.join(process.cwd(), 'db', 'seeds'),
    },
  },
};
