import { NextResponse } from 'next/server';
import getDb from '../../../../../lib/db';
import { requireEditor } from '../../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../../lib/api-helpers';

export async function POST(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const importSet = await db('import_sets').where({ id: (await params).id }).first();
    if (!importSet) return notFound('Import Set');

    const rows = await db('import_set_rows').where({ importSetId: (await params).id }).orderBy('rowNumber');
    let validCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      if (!row.mappedData) {
        await db('import_set_rows').where({ id: row.id }).update({
          validationStatus: 'error',
          errorMessages: JSON.stringify(['No mapped data']),
          updatedAt: new Date().toISOString(),
        });
        errorCount++;
        continue;
      }

      const mappedData = JSON.parse(row.mappedData);
      if (!mappedData.name) {
        await db('import_set_rows').where({ id: row.id }).update({
          validationStatus: 'error',
          errorMessages: JSON.stringify(['name is required']),
          updatedAt: new Date().toISOString(),
        });
        errorCount++;
        continue;
      }

      validCount++;
    }

    await db('import_sets').where({ id: (await params).id }).update({
      status: 'validated',
      updatedAt: new Date().toISOString(),
    });

    return success({ validCount, errorCount });
  } catch (error) {
    return handleApiError(error);
  }
}
