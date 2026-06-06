import { NextResponse } from 'next/server';
import * as client from 'openid-client';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../lib/db';
import { handleApiError } from '../../../../../lib/api-helpers';
import { generateAccessToken, generateRefreshToken, setTokens } from '../../../../../lib/auth';

export function isSafeLocalUrl(url) {
  return /^\/(?![/\\])/.test(url);
}

export async function GET(request) {
  try {
    const db = getDb();
    const enabled = await db('app_config').where({ key: 'sso_enabled' }).first();
    if (!enabled || enabled.value !== 'true') {
      return NextResponse.json({ error: 'SSO not configured' }, { status: 501 });
    }

    const [issuerUrl, clientId, clientSecret, ssoRequireVerifiedEmail] = await Promise.all([
      db('app_config').where({ key: 'oidc_issuer_url' }).first(),
      db('app_config').where({ key: 'oidc_client_id' }).first(),
      db('app_config').where({ key: 'oidc_client_secret' }).first(),
      db('app_config').where({ key: 'sso_require_verified_email' }).first(),
    ]);

    if (!issuerUrl?.value || !clientId?.value) {
      return NextResponse.json({ error: 'OIDC not configured' }, { status: 400 });
    }

    const config = await client.discovery(
      new URL(issuerUrl.value),
      clientId.value,
      clientSecret?.value,
    );

    const cookieStore = await request.cookies;
    const state = cookieStore.get('sso_state')?.value;
    const codeVerifier = cookieStore.get('sso_code_verifier')?.value;
    let returnUrl = cookieStore.get('sso_return_url')?.value || '/portal';
    if (!isSafeLocalUrl(returnUrl)) {
      returnUrl = '/portal';
    }

    const requestUrl = new URL(request.url);
    const currentState = requestUrl.searchParams.get('state');

    if (!state || state !== currentState) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const tokens = await client.authorizationCodeGrant(config, requestUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
    });

    const claims = tokens.claims();
    if (!claims) {
      return NextResponse.json({ error: 'Failed to get claims' }, { status: 400 });
    }

    const email = claims.email || claims.preferred_username || claims.sub;
    if (!email) {
      return NextResponse.json({ error: 'No email in claims' }, { status: 400 });
    }

    const requireVerified = ssoRequireVerifiedEmail ? ssoRequireVerifiedEmail.value !== 'false' : true;
    if (requireVerified && claims.email_verified !== true) {
      return NextResponse.json({ error: 'SSO email is not verified' }, { status: 400 });
    }

    let user = await db('users').where({ email }).first();
    if (!user) {
      const id = uuidv4();
      await db('users').insert({
        id,
        email,
        displayName: claims.name || claims.preferred_username || email,
        status: 'active',
      });
      user = await db('users').where({ id }).first();
    }

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, sessionId } = await generateRefreshToken(user);

    const response = NextResponse.redirect(new URL(returnUrl, request.url));
    setTokens(response, accessToken, refreshToken, sessionId);
    response.cookies.delete('sso_state');
    response.cookies.delete('sso_code_verifier');
    response.cookies.delete('sso_return_url');

    return response;
  } catch (error) {
    return handleApiError(error, 'SSO callback failed');
  }
}

export async function POST(request) {
  return GET(request);
}
