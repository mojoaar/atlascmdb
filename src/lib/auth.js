import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import { v4 as uuidv4 } from 'uuid';
import getDb from './db';

function getSecret(name, fallback) {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      throw new Error(`${name} environment variable must be set in production`);
    }
    console.warn(`[SECURITY] Using default ${name} — set ${name} env var before deploying`);
    return fallback;
  }
  return value;
}

const JWT_SECRET = getSecret('JWT_SECRET', 'atlas-dev-secret-do-not-use-in-production');
const JWT_REFRESH_SECRET = getSecret('JWT_REFRESH_SECRET', 'atlas-refresh-dev-secret-do-not-use-in-production');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const MFA_ISSUER = process.env.MFA_ISSUER || 'Atlas';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, displayName: user.displayName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function generateImpersonationToken(actor, targetUser) {
  return jwt.sign(
    { sub: targetUser.id, email: targetUser.email, displayName: targetUser.displayName, impersonatedBy: actor.id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function generateMfaToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, mfaPending: true },
    JWT_SECRET,
    { expiresIn: '5m' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

export async function generateRefreshToken(user) {
  const db = getDb();
  const token = jwt.sign(
    { sub: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  const tokenHash = await bcrypt.hash(token, 4);
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await db('sessions').insert({
    id: sessionId,
    userId: user.id,
    refreshTokenHash: tokenHash,
    expiresAt,
  });

  return { token, sessionId };
}

export async function rotateRefreshToken(oldToken, sessionId) {
  const db = getDb();

  const session = await db('sessions').where({ id: sessionId }).first();
  if (!session) return null;

  const valid = await bcrypt.compare(oldToken, session.refreshTokenHash);
  if (!valid) {
    await db('sessions').where({ userId: session.userId }).del();
    return null;
  }

  const user = await db('users').where({ id: session.userId }).first();
  if (!user) return null;

  await db('sessions').where({ id: sessionId }).del();

  return generateRefreshToken(user);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
}

export function generateMfaSecret(userEmail) {
  const totp = new OTPAuth.TOTP({
    issuer: MFA_ISSUER,
    label: `${MFA_ISSUER}:${userEmail}`,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret(),
  });
  return {
    base32: totp.secret.base32,
    otpauth_url: totp.toString(),
  };
}

export function verifyMfaToken(secret, token) {
  if (!secret || !token) return false;
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  return totp.validate({ token, window: 1 }) !== null;
}

export async function extractUserFromRequest(request) {
  const db = getDb();

  let token = null;

  const authHeader = (await request.headers).get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    const cookie = (await request.cookies).get('atlas_access');
    if (cookie) {
      token = cookie.value;
    }
  }

  if (!token) return null;

  try {
    const decoded = verifyAccessToken(token);
    if (decoded.mfaPending) return null;

    const user = await db('users').where({ id: decoded.sub }).first();
    if (!user || user.status !== 'active') return null;

    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.roleId', 'roles.id')
      .where('user_roles.userId', user.id)
      .select('roles.name');

    const teamRoles = await db('team_members')
      .join('teams', 'team_members.teamId', 'teams.id')
      .join('roles', 'teams.roleId', 'roles.id')
      .where('team_members.userId', user.id)
      .select('roles.name');

    const userRoleNames = userRoles.map(r => r.name);
    const teamRoleNames = teamRoles.map(r => r.name);

    const allRoles = userRoleNames.length > 0
      ? userRoleNames
      : teamRoleNames;
    const uniqueRoles = [...new Set(allRoles)];

    const teams = await db('team_members')
      .join('teams', 'team_members.teamId', 'teams.id')
      .where('team_members.userId', user.id)
      .select('teams.id', 'teams.name', 'team_members.memberRole');

    let impersonatedBy = null;
    if (decoded.impersonatedBy) {
      const actor = await db('users').where({ id: decoded.impersonatedBy }).first();
      if (actor) {
        impersonatedBy = { id: actor.id, displayName: actor.displayName, email: actor.email };
      }
    }

    return {
      id: impersonatedBy ? impersonatedBy.id : user.id,
      email: user.email,
      displayName: user.displayName,
      roles: uniqueRoles,
      teams,
      mfaEnabled: user.mfaEnabled,
      impersonatedBy,
      targetUserId: impersonatedBy ? user.id : null,
    };
  } catch {
    return null;
  }
}

export function getEffectiveRole(roles) {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('editor')) return 'editor';
  if (roles.includes('viewer')) return 'viewer';
  return null;
}

export function setTokens(response, accessToken, refreshToken, sessionId) {
  response.cookies.set('atlas_access', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });

  response.cookies.set('atlas_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  if (sessionId) {
    response.cookies.set('atlas_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  }
}

export function clearTokens(response) {
  response.cookies.set('atlas_access', '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set('atlas_refresh', '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set('atlas_session', '', { httpOnly: true, path: '/', maxAge: 0 });
}
