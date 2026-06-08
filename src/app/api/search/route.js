import getDb, { likeOperator } from '../../../lib/db';
import { requireAuth } from '../../../lib/rbac';
import { handleApiError, success, guardResponse } from '../../../lib/api-helpers';

const FTS_ENTITIES = [
  { type: 'service', base: 'service_base', fts: 'service_fts' },
  { type: 'application', base: 'application_base', fts: 'application_fts' },
  { type: 'ci', base: 'ci_base', fts: 'ci_fts' },
];

const LIKE_ENTITIES = [
  { type: 'team', table: 'teams' },
  { type: 'location', table: 'locations' },
];

const VALID_TYPES = ['service', 'application', 'ci', 'team', 'location'];

function formatFtsQuery(q) {
  return q.split(/\s+/).filter(Boolean).map(t => `${t}*`).join(' AND ');
}

async function searchFts(db, q, type, limit) {
  const results = [];
  const isPg = db.client.config.client === 'pg' || db.client.config.client === 'postgresql';

  for (const entity of FTS_ENTITIES) {
    if (type && type !== entity.type) continue;

    let rows;
    if (isPg) {
      const sql = `SELECT *, ts_rank(fts_vector, websearch_to_tsquery('english', ?)) as rank FROM ${entity.base} WHERE fts_vector @@ websearch_to_tsquery('english', ?) ORDER BY rank DESC LIMIT ?`;
      const res = await db.raw(sql, [q, q, limit]);
      rows = res.rows || [];
    } else {
      const ftsQ = formatFtsQuery(q);
      const sql = `SELECT sb.*, rank FROM ${entity.base} sb JOIN ${entity.fts} ON sb.rowid = ${entity.fts}.rowid WHERE ${entity.fts} MATCH ? ORDER BY rank LIMIT ?`;
      rows = await db.raw(sql, [ftsQ, limit]);
    }

    for (const row of rows) {
      results.push({
        type: entity.type,
        id: row.id,
        name: row.name,
        description: row.description,
      });
    }
  }

  return results;
}

async function searchLike(db, q, type, limit) {
  const results = [];
  const opLike = likeOperator(db);

  for (const entity of LIKE_ENTITIES) {
    if (type && type !== entity.type) continue;

    const rows = await db(entity.table)
      .where('name', opLike, `%${q}%`)
      .select('id', 'name', 'description')
      .limit(limit);

    for (const row of rows) {
      results.push({
        type: entity.type,
        id: row.id,
        name: row.name,
        description: row.description,
      });
    }
  }

  return results;
}

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const type = (searchParams.get('type') || '').trim().toLowerCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20') || 20, 100);

    if (!q) return success({ results: [], total: 0 });

    if (type && !VALID_TYPES.includes(type)) {
      return success({ results: [], total: 0 });
    }

    const [ftsResults, likeResults] = await Promise.all([
      searchFts(db, q, type, limit),
      searchLike(db, q, type, limit),
    ]);

    const results = [...ftsResults, ...likeResults].slice(0, limit);

    return success({ results, total: results.length });
  } catch (error) {
    return handleApiError(error);
  }
}
