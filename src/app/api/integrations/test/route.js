import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/rbac';
import { handleApiError, success, badRequest } from '../../../../lib/api-helpers';
import { getConnector } from '../../../../lib/connectors';

export async function POST(request) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const body = await request.json();
    const { connectorType, baseUrl, apiKey } = body;

    if (!connectorType) return badRequest('connectorType is required');

    const mod = getConnector(connectorType);
    if (!mod) return badRequest(`Unknown connector type: ${connectorType}`);

    const result = await mod.testConnection({ baseUrl, apiKey });

    return success(result);
  } catch (error) {
    return handleApiError(error);
  }
}
