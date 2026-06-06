exports.up = async function (knex) {
  await knex.schema.raw(`
    CREATE VIRTUAL TABLE service_fts USING fts5(name, description, content='service_base', content_rowid='rowid');
  `);
  await knex.schema.raw(`
    CREATE VIRTUAL TABLE application_fts USING fts5(name, description, content='application_base', content_rowid='rowid');
  `);
  await knex.schema.raw(`
    CREATE VIRTUAL TABLE ci_fts USING fts5(name, description, content='ci_base', content_rowid='rowid');
  `);

  await knex.schema.raw(`
    CREATE TRIGGER service_fts_ai AFTER INSERT ON service_base BEGIN
      INSERT INTO service_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
    END;
  `);
  await knex.schema.raw(`
    CREATE TRIGGER service_fts_ad AFTER DELETE ON service_base BEGIN
      INSERT INTO service_fts(service_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
    END;
  `);
  await knex.schema.raw(`
    CREATE TRIGGER service_fts_au AFTER UPDATE ON service_base BEGIN
      INSERT INTO service_fts(service_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
      INSERT INTO service_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
    END;
  `);

  await knex.schema.raw(`
    CREATE TRIGGER application_fts_ai AFTER INSERT ON application_base BEGIN
      INSERT INTO application_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
    END;
  `);
  await knex.schema.raw(`
    CREATE TRIGGER application_fts_ad AFTER DELETE ON application_base BEGIN
      INSERT INTO application_fts(application_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
    END;
  `);
  await knex.schema.raw(`
    CREATE TRIGGER application_fts_au AFTER UPDATE ON application_base BEGIN
      INSERT INTO application_fts(application_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
      INSERT INTO application_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
    END;
  `);

  await knex.schema.raw(`
    CREATE TRIGGER ci_fts_ai AFTER INSERT ON ci_base BEGIN
      INSERT INTO ci_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
    END;
  `);
  await knex.schema.raw(`
    CREATE TRIGGER ci_fts_ad AFTER DELETE ON ci_base BEGIN
      INSERT INTO ci_fts(ci_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
    END;
  `);
  await knex.schema.raw(`
    CREATE TRIGGER ci_fts_au AFTER UPDATE ON ci_base BEGIN
      INSERT INTO ci_fts(ci_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
      INSERT INTO ci_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
    END;
  `);

  await knex.schema.raw(`
    INSERT INTO service_fts(rowid, name, description) SELECT rowid, name, description FROM service_base;
  `);
  await knex.schema.raw(`
    INSERT INTO application_fts(rowid, name, description) SELECT rowid, name, description FROM application_base;
  `);
  await knex.schema.raw(`
    INSERT INTO ci_fts(rowid, name, description) SELECT rowid, name, description FROM ci_base;
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw('DROP TRIGGER IF EXISTS service_fts_ai');
  await knex.schema.raw('DROP TRIGGER IF EXISTS service_fts_ad');
  await knex.schema.raw('DROP TRIGGER IF EXISTS service_fts_au');
  await knex.schema.raw('DROP TRIGGER IF EXISTS application_fts_ai');
  await knex.schema.raw('DROP TRIGGER IF EXISTS application_fts_ad');
  await knex.schema.raw('DROP TRIGGER IF EXISTS application_fts_au');
  await knex.schema.raw('DROP TRIGGER IF EXISTS ci_fts_ai');
  await knex.schema.raw('DROP TRIGGER IF EXISTS ci_fts_ad');
  await knex.schema.raw('DROP TRIGGER IF EXISTS ci_fts_au');
  await knex.schema.raw('DROP TABLE IF EXISTS service_fts');
  await knex.schema.raw('DROP TABLE IF EXISTS application_fts');
  await knex.schema.raw('DROP TABLE IF EXISTS ci_fts');
};
