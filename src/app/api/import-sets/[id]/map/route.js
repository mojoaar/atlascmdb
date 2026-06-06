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

    const { rows } = await request.json();
    if (!rows?.length) return NextResponse.json({ error: 'rows required' }, { status: 400 });

    const mappings = await db('import_mappings').where({ importSetId: (await params).id }).orderBy('orderIndex');

    for (const row of rows) {
      const sourceData = typeof row.sourceData === 'string' ? JSON.parse(row.sourceData) : row.sourceData;
      const mappedData = {};
      let hasErrors = false;
      const errorMessages = [];

      for (const mapping of mappings) {
        const sourceValue = sourceData[mapping.sourceField];

        if (mapping.required && !sourceValue) {
          hasErrors = true;
          errorMessages.push(`${mapping.sourceField} is required`);
          continue;
        }

        mappedData[mapping.targetField] = mapping.transformRule === 'uppercase'
          ? String(sourceValue).toUpperCase()
          : mapping.transformRule === 'lowercase'
            ? String(sourceValue).toLowerCase()
            : sourceValue;
      }

      await db('import_set_rows').where({ id: row.id }).update({
        mappedData: JSON.stringify(mappedData),
        validationStatus: hasErrors ? 'error' : 'valid',
        errorMessages: hasErrors ? JSON.stringify(errorMessages) : null,
        updatedAt: new Date().toISOString(),
      });
    }

    await db('import_sets').where({ id: (await params).id }).update({
      status: 'mapped',
      updatedAt: new Date().toISOString(),
    });

    return success({ message: 'Mapping complete' });
  } catch (error) {
    return handleApiError(error);
  }
}
