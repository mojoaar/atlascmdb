import { NextResponse } from 'next/server';
import { isScimEnabled } from '../../../../../lib/scim';
import { handleApiError } from '../../../../../lib/api-helpers';

export async function GET() {
  try {
    const enabled = await isScimEnabled();
    if (!enabled) return NextResponse.json({ error: 'SCIM not enabled' }, { status: 404 });
    return NextResponse.json({
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: 2,
    Resources: [
      {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
        id: 'User',
        name: 'User',
        endpoint: '/Users',
        schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
        meta: { resourceType: 'ResourceType', location: '/v2/ResourceTypes/User' },
      },
      {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
        id: 'Group',
        name: 'Group',
        endpoint: '/Groups',
        schema: 'urn:ietf:params:scim:schemas:core:2.0:Group',
        meta: { resourceType: 'ResourceType', location: '/v2/ResourceTypes/Group' },
      },
    ],
  });
  } catch (error) {
    return handleApiError(error);
  }
}
