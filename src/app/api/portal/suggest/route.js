import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, success } from '../../../../lib/api-helpers';

const FTS_ENTITIES = [
  { type: 'service', base: 'service_base', fts: 'service_fts' },
  { type: 'application', base: 'application_base', fts: 'application_fts' },
  { type: 'ci', base: 'ci_base', fts: 'ci_fts' },
];

const LIKE_ENTITIES = [
  { type: 'team', table: 'teams' },
  { type: 'location', table: 'locations' },
  { type: 'asset', table: 'assets' },
];

function formatFtsQuery(q) {
  return q.split(/\s+/).filter(Boolean).map(t => `${t}*`).join(' AND ');
}

async function suggestFts(db, q, type, limit) {
  const suggestions = [];
  const ftsQ = formatFtsQuery(q);

  for (const entity of FTS_ENTITIES) {
    if (type && entity.type !== type) continue;
    const sql = `SELECT sb.id, sb.name, rank FROM ${entity.base} sb JOIN ${entity.fts} ON sb.rowid = ${entity.fts}.rowid WHERE ${entity.fts} MATCH ? ORDER BY rank LIMIT ?`;
    const rows = await db.raw(sql, [ftsQ, limit]);

    for (const row of rows) {
      suggestions.push({ type: entity.type, id: row.id, name: row.name });
    }
  }

  return suggestions;
}

async function suggestLike(db, q, type, limit) {
  const suggestions = [];

  for (const entity of LIKE_ENTITIES) {
    if (type && entity.type !== type) continue;
    const rows = await db(entity.table)
      .where('name', 'like', `%${q}%`)
      .select('id', 'name')
      .limit(limit);

    for (const row of rows) {
      suggestions.push({ type: entity.type, id: row.id, name: row.name });
    }
  }

  return suggestions;
}

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const type = searchParams.get('type');

    if (!q || q.length < 2) return success({ suggestions: [] });

    const [ftsSuggestions, likeSuggestions] = await Promise.all([
      suggestFts(db, q, type, 10),
      suggestLike(db, q, type, 10),
    ]);

    const suggestions = [...ftsSuggestions, ...likeSuggestions].slice(0, 10);

    return success({ suggestions });
  } catch (error) {
    return handleApiError(error);
  }
}
