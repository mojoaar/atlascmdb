import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../lib/db';
import { requireEditor } from '../../../../../lib/rbac';
import { handleApiError, notFound, success } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const db = getDb();
    const importSet = await db('import_sets').where({ id: (await params).id }).first();
    if (!importSet) return notFound('Import Set');

    const validRows = await db('import_set_rows')
      .where({ importSetId: (await params).id, validationStatus: 'valid' })
      .orderBy('rowNumber');

    let committed = 0;
    let failed = 0;

    await db.transaction(async (trx) => {
      for (const row of validRows) {
        try {
          const mappedData = JSON.parse(row.mappedData);
          const baseId = uuidv4();

          await trx('service_base').insert({
            id: baseId,
            name: mappedData.name,
            description: mappedData.description || null,
            ownerTeamId: mappedData.ownerTeamId || null,
            lifecycleStatus: mappedData.lifecycleStatus || null,
            environment: mappedData.environment || null,
            classification: mappedData.classification || null,
          });

          await trx('import_set_rows').where({ id: row.id }).update({
            destinationTable: 'service_base',
            destinationRecordId: baseId,
            updatedAt: new Date().toISOString(),
          });

          committed++;
        } catch (err) {
          await trx('import_set_rows').where({ id: row.id }).update({
            validationStatus: 'error',
            errorMessages: JSON.stringify([err.message]),
            updatedAt: new Date().toISOString(),
          });
          failed++;
        }
      }
    });

    await db('import_sets').where({ id: (await params).id }).update({
      status: 'committed',
      committedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await logAudit({
      actorUserId: auth.user.id, entityType: 'import', entityId: (await params).id,
      action: 'committed', afterData: { committed, failed, total: validRows.length },
    });

    return success({ committed, failed, total: validRows.length });
  } catch (error) {
    return handleApiError(error);
  }
}
