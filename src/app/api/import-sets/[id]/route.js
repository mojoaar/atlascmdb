import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { id } = await params;
    const db = getDb();
    const set = await db('import_sets')
      .leftJoin('users', 'import_sets.createdBy', 'users.id')
      .select('import_sets.*', 'users.displayName as createdByName')
      .where('import_sets.id', id)
      .first();

    if (!set) return notFound('Import Set');

    const rows = await db('import_set_rows').where({ importSetId: id }).orderBy('rowNumber');
    const mappings = await db('import_mappings').where({ importSetId: id }).orderBy('orderIndex');

    return success({ ...set, rows, mappings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { id } = await params;
    const db = getDb();
    const { name, status } = await request.json();

    await db('import_sets').where({ id }).update({
      ...(name ? { name } : {}),
      ...(status ? { status } : {}),
      updatedAt: new Date().toISOString(),
    });

    const updated = await db('import_sets').where({ id }).first();
    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const { id } = await params;
    const db = getDb();
    const importSet = await db('import_sets').where({ id }).first();
    if (!importSet) return notFound('Import Set');

    const { rows, mappings } = await request.json();

    if (rows?.length) {
      await db('import_set_rows').where({ importSetId: id }).del();
      const rowData = rows.map((row, i) => ({
        id: uuidv4(),
        importSetId: id,
        rowNumber: i + 1,
        sourceData: typeof row === 'string' ? row : JSON.stringify(row),
        validationStatus: 'pending',
      }));
      await db('import_set_rows').insert(rowData);
    }

    if (mappings?.length) {
      await db('import_mappings').where({ importSetId: id }).del();
      const mapData = mappings.map((m, i) => ({
        id: uuidv4(),
        importSetId: id,
        sourceField: m.sourceField,
        targetField: m.targetField,
        transformRule: m.transformRule,
        required: m.required || false,
        orderIndex: i,
      }));
      await db('import_mappings').insert(mapData);
    }

    await db('import_sets').where({ id }).update({
      status: 'uploaded',
      updatedAt: new Date().toISOString(),
    });

    return success({ message: 'Data uploaded' });
  } catch (error) {
    return handleApiError(error);
  }
}
