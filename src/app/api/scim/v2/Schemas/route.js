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
        id: 'urn:ietf:params:scim:schemas:core:2.0:User',
        name: 'User',
        attributes: [
          { name: 'userName', type: 'string', required: true },
          { name: 'name', type: 'complex', subAttributes: [
            { name: 'formatted', type: 'string' },
            { name: 'givenName', type: 'string' },
            { name: 'familyName', type: 'string' },
          ]},
          { name: 'displayName', type: 'string' },
          { name: 'emails', type: 'complex', multiValued: true, subAttributes: [
            { name: 'value', type: 'string' },
            { name: 'primary', type: 'boolean' },
          ]},
          { name: 'active', type: 'boolean' },
        ],
      },
      {
        id: 'urn:ietf:params:scim:schemas:core:2.0:Group',
        name: 'Group',
        attributes: [
          { name: 'displayName', type: 'string', required: true },
          { name: 'members', type: 'complex', multiValued: true, subAttributes: [
            { name: 'value', type: 'string' },
            { name: 'display', type: 'string' },
          ]},
        ],
      },
    ],
  });
  } catch (error) {
    return handleApiError(error);
  }
}
