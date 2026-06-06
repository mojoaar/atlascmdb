import { NextResponse } from 'next/server';
import * as client from 'openid-client';
import getDb from '../../../../../lib/db';
import { handleApiError } from '../../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/portal';

    const db = getDb();
    const enabled = await db('app_config').where({ key: 'sso_enabled' }).first();
    if (!enabled || enabled.value !== 'true') {
      return NextResponse.json({ error: 'SSO not configured' }, { status: 501 });
    }

    const [issuerUrl, clientId, clientSecret] = await Promise.all([
      db('app_config').where({ key: 'oidc_issuer_url' }).first(),
      db('app_config').where({ key: 'oidc_client_id' }).first(),
      db('app_config').where({ key: 'oidc_client_secret' }).first(),
    ]);

    if (!issuerUrl?.value || !clientId?.value) {
      return NextResponse.json({ error: 'OIDC not configured' }, { status: 400 });
    }

    const config = await client.discovery(
      new URL(issuerUrl.value),
      clientId.value,
      clientSecret?.value,
    );

    const callbackUrl = new URL('/api/auth/sso/callback', request.url).toString();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();

    const authUrl = client.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: 'openid profile email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('sso_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
    response.cookies.set('sso_code_verifier', codeVerifier, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
    response.cookies.set('sso_return_url', returnUrl, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });

    return response;
  } catch (error) {
    return handleApiError(error, 'SSO initiation failed');
  }
}

export async function POST(request) {
  return GET(request);
}
