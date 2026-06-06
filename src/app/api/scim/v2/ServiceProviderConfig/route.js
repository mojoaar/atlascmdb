import { NextResponse } from 'next/server';
import { isScimEnabled } from '../../../../../lib/scim';
import { handleApiError } from '../../../../../lib/api-helpers';

export async function GET() {
  try {
    const enabled = await isScimEnabled();
    if (!enabled) return NextResponse.json({ error: 'SCIM not enabled' }, { status: 404 });
    return NextResponse.json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
    documentationUri: '/apidocs',
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        name: 'OAuth Bearer Token',
        description: 'SCIM Bearer Token',
        specUri: 'https://tools.ietf.org/html/rfc6750',
        type: 'oauthbearertoken',
      },
    ],
  });
  } catch (error) {
    return handleApiError(error);
  }
}
