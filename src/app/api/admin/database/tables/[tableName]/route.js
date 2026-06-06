import { NextResponse } from 'next/server';
import getDb from '../../../../../../lib/db';
import { requireAdmin } from '../../../../../../lib/rbac';
import { handleApiError, success, notFound } from '../../../../../../lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { tableName } = await params;
    const db = getDb();

    // Whitelist check to prevent SQL Injection
    let tables = [];
    if (db.client.config.client === 'sqlite3' || db.client.config.client === 'better-sqlite3') {
      const rows = await db.raw(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%'"
      );
      tables = rows.map((r) => r.name);
    } else {
      const rows = await db.raw(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name NOT LIKE 'knex_%'"
      );
      tables = rows.rows.map((r) => r.table_name);
    }

    if (!tables.includes(tableName)) {
      return notFound(`Table '${tableName}'`);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort = searchParams.get('sort');
    const order = (searchParams.get('order') || 'asc').toLowerCase();
    const search = searchParams.get('search');

    // Get column definitions (schema info) database-agnostically
    const schemaInfo = await db(tableName).columnInfo();

    // Query rows
    let query = db(tableName);

    // If search keyword is provided, search across any text columns dynamically
    if (search) {
      query = query.where(function () {
        const columns = Object.keys(schemaInfo);
        let textColCount = 0;
        columns.forEach((col) => {
          const colType = (schemaInfo[col].type || '').toLowerCase();
          const isText = ['string', 'varchar', 'text', 'char', 'nvarchar'].some((t) => colType.includes(t));
          if (isText) {
            if (textColCount === 0) {
              this.where(col, 'like', `%${search}%`);
            } else {
              this.orWhere(col, 'like', `%${search}%`);
            }
            textColCount++;
          }
        });
      });
    }

    // Clone query for total count
    const [countResult] = await query.clone().count('* as total');
    const total = countResult ? countResult.total : 0;

    // Apply sorting
    if (sort && schemaInfo[sort]) {
      const sortOrder = ['asc', 'desc'].includes(order) ? order : 'asc';
      query = query.orderBy(sort, sortOrder);
    }

    // Retrieve rows
    const rows = await query.limit(limit).offset(offset);

    return success({
      tableName,
      schema: schemaInfo,
      data: rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch table records');
  }
}
